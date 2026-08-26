import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import type { GridColDef } from '@mui/x-data-grid';
import PageHeader from '../../components/PageHeader';
import StatusTag from '../../components/StatusTag';
import DataCard from '../../components/admin/DataCard';
import EmptyState from '../../components/EmptyState';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useSearchFilter } from '../../hooks/useSearchFilter';
import { useToast } from '../../contexts/ToastProvider';
import { useAuth } from '../../contexts/AuthProvider';
import { ApiError } from '../../services/apiClient';
import {
  createStaffUser,
  deactivateUser,
  fetchPermissionCatalogue,
  fetchRoles,
  fetchUsers,
  reactivateUser,
  resetUserPassword,
  updateRolePermissions,
  type RoleSummary,
  type StaffUser,
} from '../../services/admin';
import { describeLastSignal } from '../../services/admin';
import { problemsWith } from '../../services/password';
import { tokens } from '../../theme';

/**
 * Who may run the platform, and what running it entitles them to do.
 *
 * Roles are the unit of assignment and permissions the unit of enforcement, which is why the two
 * cards are separate. Changing what an Admin may do is a data change the API supports without a
 * deployment — this is the surface for it.
 *
 * SuperAdmin is deliberately not editable. A SuperAdmin who can strip SuperAdmin's own
 * permissions can lock every person out of the system with one request, unrecoverably; the server
 * refuses it, and the console does not offer it.
 */

type PendingUserAction =
  | { kind: 'reset'; user: StaffUser }
  | { kind: 'deactivate'; user: StaffUser }
  | { kind: 'reactivate'; user: StaffUser };

function getUserColumns(
  onAction: (action: PendingUserAction) => void,
  selfId: string | undefined,
): GridColDef<StaffUser>[] {
  return [
    { field: 'fullName', headerName: 'Name', flex: 1, minWidth: 160 },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.2,
      minWidth: 200,
      valueGetter: (_v, row) => row.email ?? row.userName,
    },
    {
      field: 'roles',
      headerName: 'Roles',
      flex: 1,
      minWidth: 170,
      valueGetter: (_v, row) => (row.roles.length > 0 ? row.roles.join(', ') : 'None'),
    },
    {
      field: 'isActive',
      headerName: 'Account',
      flex: 0.6,
      minWidth: 110,
      renderCell: (params) => (
        <StatusTag
          label={params.row.isActive ? 'Active' : 'Deactivated'}
          variant={params.row.isActive ? 'live' : 'error'}
        />
      ),
    },
    {
      field: 'lastLoginAtUtc',
      headerName: 'Last signed in',
      flex: 0.8,
      minWidth: 140,
      valueGetter: (_v, row) => (row.lastLoginAtUtc ? describeLastSignal(row.lastLoginAtUtc) : 'never'),
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 210,
      renderCell: (params) => {
        // Nobody deactivates themselves. The server allows it and the result is an administrator
        // locked out of the console they were using, with nobody obviously responsible for
        // letting them back in.
        const isSelf = params.row.userId === selfId;

        return (
          <Box sx={{ display: 'flex', gap: '4px' }}>
            <Button
              size="small"
              sx={{ textTransform: 'none', fontWeight: 600 }}
              onClick={() => onAction({ kind: 'reset', user: params.row })}
            >
              Reset password
            </Button>
            {params.row.isActive ? (
              <Button
                size="small"
                color="error"
                disabled={isSelf}
                sx={{ textTransform: 'none', fontWeight: 600 }}
                onClick={() => onAction({ kind: 'deactivate', user: params.row })}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                size="small"
                sx={{ textTransform: 'none', fontWeight: 600 }}
                onClick={() => onAction({ kind: 'reactivate', user: params.row })}
              >
                Reactivate
              </Button>
            )}
          </Box>
        );
      },
    },
  ];
}

function RolesCard({
  roles,
  catalogue,
  loading,
  error,
  onEdit,
}: {
  roles: RoleSummary[];
  catalogue: string[];
  loading: boolean;
  error: string | null;
  onEdit: (role: RoleSummary) => void;
}) {
  return (
    <Card sx={{ p: '22px', mb: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
        Who may do what
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '4px' }}>Roles and permissions</Typography>
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: '14px' }}>
        Endpoints authorise against permissions, never against role names — so changing what a role
        may do is a data change rather than a deployment. {catalogue.length} permissions exist.
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ fontSize: 13 }}>{error}</Alert>
      ) : loading ? (
        <EmptyState title="Loading roles…" />
      ) : roles.length === 0 ? (
        <EmptyState title="No roles are defined" />
      ) : (
        roles.map((role) => (
          <Box
            key={role.role}
            sx={{
              padding: '14px 0', borderBottom: '1px solid', borderColor: 'divider',
              '&:last-of-type': { borderBottom: 'none' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '8px', flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{role.role}</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}
              </Typography>
              <Box sx={{ flex: 1 }} />
              {role.role === 'SuperAdmin' ? (
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  Not editable — stripping it would lock everyone out
                </Typography>
              ) : (
                <Button size="small" sx={{ textTransform: 'none', fontWeight: 600 }} onClick={() => onEdit(role)}>
                  Edit
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {role.permissions.length === 0 ? (
                <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>Holds nothing.</Typography>
              ) : (
                role.permissions.map((permission) => (
                  <Chip
                    key={permission}
                    size="small"
                    label={permission}
                    sx={{ height: 22, fontSize: 11.5, fontFamily: 'monospace', backgroundColor: '#F1F2F6', color: tokens.textMuted }}
                  />
                ))
              )}
            </Box>
          </Box>
        ))
      )}
    </Card>
  );
}

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const { session } = useAuth();

  const [action, setAction] = useState<PendingUserAction | null>(null);
  const [reason, setReason] = useState('');
  const [issued, setIssued] = useState<{ user: StaffUser; password: string } | null>(null);
  const [editingRole, setEditingRole] = useState<RoleSummary | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [working, setWorking] = useState(false);

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ email: '', firstName: '', lastName: '', password: '', roles: [] as string[] });
  const [addError, setAddError] = useState<string[] | null>(null);

  const loaded = useAsyncData<{ users: StaffUser[]; roles: RoleSummary[]; catalogue: string[] }>(
    async (signal) => {
      const [users, roles, catalogue] = await Promise.all([
        fetchUsers(1, 100, signal).then((page) => page.items),
        fetchRoles(signal).catch(() => [] as RoleSummary[]),
        fetchPermissionCatalogue(signal).catch(() => [] as string[]),
      ]);
      return { users, roles, catalogue };
    },
    [],
    'Staff accounts could not be loaded.',
  );

  const users = useMemo(() => loaded.data?.users ?? [], [loaded.data]);
  const roles = useMemo(() => loaded.data?.roles ?? [], [loaded.data]);
  const catalogue = useMemo(() => loaded.data?.catalogue ?? [], [loaded.data]);

  const { search, setSearch, filtered } = useSearchFilter(users, ['fullName', 'email', 'userName']);

  const columns = useMemo(
    () => getUserColumns((next) => { setAction(next); setReason(''); }, session?.userId),
    [session?.userId],
  );

  const confirmUserAction = async () => {
    if (!action) return;

    setWorking(true);
    try {
      if (action.kind === 'reset') {
        const { temporaryPassword } = await resetUserPassword(action.user.userId);
        setIssued({ user: action.user, password: temporaryPassword });
      } else if (action.kind === 'deactivate') {
        await deactivateUser(action.user.userId, reason.trim() || undefined);
        showToast(`${action.user.fullName} deactivated.`);
      } else {
        await reactivateUser(action.user.userId);
        showToast(`${action.user.fullName} reactivated.`);
      }
      setAction(null);
      loaded.reload();
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : 'That change could not be saved.');
    } finally {
      setWorking(false);
    }
  };

  /**
   * The same rules the change-password screen applies, checked before asking the server.
   *
   * Reused rather than restated: two lists of password rules in one app drift, and the one that
   * drifts is always the one nobody is looking at. The server stays the authority — this only
   * catches what is obviously wrong before a round trip.
   */
  const draftProblems = (): string[] => {
    const problems: string[] = [];

    if (!draft.email.trim()) problems.push('An email address is required.');
    if (!draft.firstName.trim() || !draft.lastName.trim()) problems.push('A first and last name are required.');
    if (draft.roles.length === 0) problems.push('Pick at least one role.');

    return [...problems, ...problemsWith(draft.password, draft.password)];
  };

  const addUser = async () => {
    const problems = draftProblems();
    if (problems.length > 0) {
      setAddError(problems);
      return;
    }

    setWorking(true);
    setAddError(null);
    try {
      const created = await createStaffUser(draft);
      showToast(`${created.fullName || created.email} created.`);
      setAdding(false);
      setDraft({ email: '', firstName: '', lastName: '', password: '', roles: [] });
      loaded.reload();
    } catch (e: unknown) {
      // The server returns its own list on a policy failure, and a conflict when the address is
      // taken. Both are worth showing verbatim rather than flattening to "could not create".
      setAddError(
        e instanceof ApiError
          ? (e.problems.length > 0 ? e.problems : [e.message])
          : ['That account could not be created.'],
      );
    } finally {
      setWorking(false);
    }
  };

  const saveRole = async () => {
    if (!editingRole) return;

    setWorking(true);
    try {
      await updateRolePermissions(editingRole.role, selected);
      showToast(`${editingRole.role} now holds ${selected.length} permission${selected.length === 1 ? '' : 's'}.`);
      setEditingRole(null);
      loaded.reload();
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : 'Those permissions could not be saved.');
    } finally {
      setWorking(false);
    }
  };

  const active = users.filter((u) => u.isActive).length;

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Staff accounts, and what each role is entitled to do."
      />

      <RolesCard
        roles={roles}
        catalogue={catalogue}
        loading={loaded.loading}
        error={loaded.error}
        onEdit={(role) => { setEditingRole(role); setSelected([...role.permissions]); }}
      />

      <DataCard
        title="Staff accounts"
        count={users.length}
        actions={
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: 'none', fontWeight: 600 }}
            onClick={() => { setAdding(true); setAddError(null); }}
          >
            Add user
          </Button>
        }
        search={{ value: search, onChange: setSearch, placeholder: 'Search name or email' }}
        loading={loaded.loading}
        error={loaded.error}
        onRetry={loaded.reload}
        rows={filtered}
        columns={columns}
        getRowId={(row) => row.userId}
        emptyTitle="No staff accounts"
        emptyDescription="Accounts created for people who run the platform appear here."
        note={`${active} of ${users.length} active. There is no self-service password reset anywhere on the platform — no email or SMS provider is connected — so a reset here is read out to the person by whoever issues it.`}
      />

      <Dialog open={adding} onClose={working ? undefined : () => setAdding(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17 }}>Add a staff account</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mb: 2 }}>
            Created directly, with no review step — an administrator is making it. They can sign in
            immediately with the password you set here, so it has to reach them some other way.
          </Typography>

          {addError && (
            <Alert severity="error" sx={{ fontSize: 12.5, mb: 2 }}>
              {addError.map((problem) => <Box key={problem}>{problem}</Box>)}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '14px', mb: '14px' }}>
            <TextField
              label="First name"
              value={draft.firstName}
              onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
              disabled={working}
              autoFocus
            />
            <TextField
              label="Last name"
              value={draft.lastName}
              onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
              disabled={working}
            />
          </Box>

          <TextField
            label="Email"
            type="email"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            fullWidth
            disabled={working}
            sx={{ mb: '14px' }}
            helperText="Also becomes their username."
          />

          <TextField
            label="Password"
            type="password"
            value={draft.password}
            onChange={(e) => setDraft({ ...draft, password: e.target.value })}
            fullWidth
            disabled={working}
            sx={{ mb: '14px' }}
            helperText="At least 8 characters, with an uppercase letter, a lowercase letter and a digit."
          />

          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: '4px' }}>Roles</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '2px' }}>
            {roles.map((role) => (
              <FormControlLabel
                key={role.role}
                control={
                  <Checkbox
                    size="small"
                    disabled={working}
                    checked={draft.roles.includes(role.role)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        roles: e.target.checked
                          ? [...draft.roles, role.role]
                          : draft.roles.filter((r) => r !== role.role),
                      })
                    }
                  />
                }
                label={<Typography sx={{ fontSize: 13 }}>{role.role}</Typography>}
              />
            ))}
          </Box>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: '6px' }}>
            Only a SuperAdmin may grant SuperAdmin. The server refuses it either way, so if you are
            not one the request comes back saying so.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" disabled={working} onClick={() => setAdding(false)}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            disabled={working}
            startIcon={working ? <CircularProgress size={14} color="inherit" /> : undefined}
            onClick={addUser}
          >
            Create account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmations. Reset issues a credential, so it gets its own second dialog rather than
          a toast that scrolls away with the only copy of the password in it. */}
      <Dialog open={action !== null} onClose={working ? undefined : () => setAction(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17 }}>
          {action?.kind === 'reset' && `Reset ${action.user.fullName}'s password`}
          {action?.kind === 'deactivate' && `Deactivate ${action.user.fullName}`}
          {action?.kind === 'reactivate' && `Reactivate ${action.user.fullName}`}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mb: 2 }}>
            {action?.kind === 'reset' &&
              'A temporary password is generated and shown once. They will have to replace it before they can do anything else.'}
            {action?.kind === 'deactivate' &&
              'They will be signed out and cannot sign in again until this is reversed.'}
            {action?.kind === 'reactivate' &&
              'They will be able to sign in again with their existing password.'}
          </Typography>

          {action?.kind === 'deactivate' && (
            <TextField
              label="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              autoFocus
              disabled={working}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" disabled={working} onClick={() => setAction(null)}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            color={action?.kind === 'deactivate' ? 'error' : 'primary'}
            disabled={working}
            startIcon={working ? <CircularProgress size={14} color="inherit" /> : undefined}
            onClick={confirmUserAction}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={issued !== null} onClose={() => setIssued(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17 }}>Temporary password</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ fontSize: 12.5, mb: 2 }}>
            This is the only time it is shown. The server does not keep a readable copy and never
            writes it to a log — if this dialog is closed before it is read out, issue another.
          </Alert>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: '6px' }}>
            For {issued?.user.fullName} ({issued?.user.email ?? issued?.user.userName})
          </Typography>
          <Box
            sx={{
              padding: '14px', borderRadius: '10px', backgroundColor: '#F1F2F6',
              fontFamily: 'monospace', fontSize: 20, fontWeight: 700, letterSpacing: '0.06em',
              textAlign: 'center', userSelect: 'all',
            }}
          >
            {issued?.password}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setIssued(null)}>I have read it out</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editingRole !== null} onClose={working ? undefined : () => setEditingRole(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17 }}>
          What {editingRole?.role} may do
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', mb: 2 }}>
            This replaces the role's permissions outright. It takes effect the next time each
            holder signs in, because permissions are copied into the token at sign-in.
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: '2px' }}>
            {catalogue.map((permission) => (
              <FormControlLabel
                key={permission}
                control={
                  <Checkbox
                    size="small"
                    disabled={working}
                    checked={selected.includes(permission)}
                    onChange={(e) =>
                      setSelected((current) =>
                        e.target.checked
                          ? [...current, permission]
                          : current.filter((p) => p !== permission))
                    }
                  />
                }
                label={
                  <Typography sx={{ fontSize: 12.5, fontFamily: 'monospace' }}>{permission}</Typography>
                }
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" disabled={working} onClick={() => setEditingRole(null)}>Cancel</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            disabled={working}
            startIcon={working ? <CircularProgress size={14} color="inherit" /> : undefined}
            onClick={saveRole}
          >
            Save {selected.length} permission{selected.length === 1 ? '' : 's'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
