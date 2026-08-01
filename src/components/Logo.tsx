import Box from '@mui/material/Box';
import logoFull from '../assets/brand/logo.png';
import logoIcon from '../assets/brand/icon.png';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  onDark?: boolean;
};

const HEIGHTS = { sm: 22, md: 30, lg: 40 };

export default function Logo({ size = 'md', onDark = false }: LogoProps) {
  const height = HEIGHTS[size];
  return (
    <Box
      component="img"
      src={onDark ? logoIcon : logoFull}
      alt="AdzOnRoad"
      sx={{ height, width: 'auto', display: 'block' }}
    />
  );
}
