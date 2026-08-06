import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { tokens } from '../theme';

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export default function ErrorState({ title = 'Something went wrong', description = 'This section couldn\'t load. Please try again.', onRetry }: ErrorStateProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: '48px', px: '24px' }}>
      <Box sx={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#FDECEC', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: '14px', color: tokens.red }}>
        <ErrorOutlineIcon />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{title}</Typography>
      <Typography sx={{ fontSize: 13, mt: '4px', color: 'text.secondary', maxWidth: 340 }}>{description}</Typography>
      {onRetry && (
        <Button onClick={onRetry} variant="outlined" color="inherit" sx={{ mt: '16px', borderColor: tokens.border, color: tokens.text }}>
          Retry
        </Button>
      )}
    </Box>
  );
}
