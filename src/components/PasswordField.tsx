import { useState } from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

type PasswordFieldProps = Omit<TextFieldProps, 'type'>;

/**
 * A password input with a reveal toggle.
 *
 * The toggle starts hidden and never persists: revealing is for checking a typo on the spot, and
 * a field that stays legible across renders is a password left on screen. The button is excluded
 * from the tab order — tabbing out of a password field should reach the submit button, not an eye
 * icon — and carries its own label, since its only content is an icon.
 */
export default function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const label = visible ? 'Hide password' : 'Show password';

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      slotProps={{
        ...props.slotProps,
        input: {
          ...props.slotProps?.input,
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={label}>
                <span>
                  <IconButton
                    aria-label={label}
                    onClick={() => setVisible((shown) => !shown)}
                    edge="end"
                    size="small"
                    tabIndex={-1}
                    disabled={props.disabled}
                  >
                    {visible ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
