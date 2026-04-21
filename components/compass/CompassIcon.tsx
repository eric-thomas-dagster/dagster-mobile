import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

type Props = {
  size?: number;
};

// Mirrors the Dagster+ Compass icon from /_next/static/media/compass.a65d4e1f.svg
export const CompassIcon: React.FC<Props> = ({ size = 22 }) => {
  const gradId = 'compass_gradient';
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Defs>
        <LinearGradient
          id={gradId}
          x1="1.55"
          y1="17.5484"
          x2="19.608"
          y2="10.865"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#3C39EE" />
          <Stop offset="0.359779" stopColor="#468AFC" />
          <Stop offset="0.745188" stopColor="#0DA7CD" />
          <Stop offset="1" stopColor="#49C5F4" />
        </LinearGradient>
      </Defs>
      <Path
        d="M8.00012 0C3.58165 0 0 3.58165 0 8.00012C0 12.4186 3.58165 16.0002 8.00012 16.0002C12.4186 16.0002 16.0002 12.4186 16.0002 8.00012C16.0002 3.58165 12.4184 0 8.00012 0ZM13.1923 8.27331L9.50064 8.62158L11.8646 11.4782L11.4782 11.8646L8.62158 9.50064L8.27331 13.1923H7.72692L7.40138 9.74261L3.25978 13.17L2.83024 12.7404L6.25762 8.59885L2.80797 8.27331V7.72692L6.49959 7.37865L4.13562 4.522L4.522 4.13562L7.37865 6.49959L7.72692 2.80797H8.27331L8.59886 6.25762L12.7404 2.83024L13.17 3.25978L9.74261 7.40137L13.1923 7.72692V8.27331Z"
        fill={`url(#${gradId})`}
      />
    </Svg>
  );
};
