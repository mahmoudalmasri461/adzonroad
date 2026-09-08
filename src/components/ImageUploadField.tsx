import { useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

type ImageUploadFieldProps = {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
};

export default function ImageUploadField({ label, file, onChange }: ImageUploadFieldProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Box>
      <Typography sx={{ fontSize: 13, fontWeight: 600, mb: '6px' }}>{label}</Typography>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <UploadFileIcon fontSize="small" color="action" />
          <Typography sx={{ fontSize: 13, flex: 1 }} noWrap>
            {file.name}
          </Typography>
          <IconButton size="small" aria-label={t('common.removeFile')} onClick={() => onChange(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Button
          variant="outlined"
          color="inherit"
          fullWidth
          startIcon={<UploadFileIcon />}
          onClick={() => inputRef.current?.click()}
          sx={{ justifyContent: 'flex-start', fontWeight: 500 }}
        >
          {t('common.uploadImage')}
        </Button>
      )}
    </Box>
  );
}
