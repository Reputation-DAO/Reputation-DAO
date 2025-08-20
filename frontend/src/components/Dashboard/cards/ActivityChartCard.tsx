import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
} from '@mui/material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ChartData {
  date: string;
  awards: number;
  revokes: number;
}

interface ActivityChartCardProps {
  userRole: string;
  chartData: ChartData[];
  bgColor?: string;
  borderColor?: string;
}

const ActivityChartCard: React.FC<ActivityChartCardProps> = ({
  userRole,
  chartData,
  bgColor = "hsl(var(--background))",
  borderColor = "hsl(var(--border))",
}) => {
  return (
    <Card
      sx={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "var(--radius)",
        boxShadow: `
          4px 4px 10px hsl(var(--muted) / 0.4), 
          -4px -4px 10px hsl(var(--muted) / 0.1)
        `,
        transition: "var(--transition-smooth)",
        "&:hover": {
          boxShadow: `
            6px 6px 14px hsl(var(--primary) / 0.5),
            -6px -6px 14px hsl(var(--primary) / 0.2)
          `,
        },
        mb: 4,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Typography
          variant="subtitle2"
          sx={{
            color: "hsl(var(--muted-foreground))",
            fontSize: "0.9rem",
            fontWeight: 600,
            letterSpacing: 0.3,
            mb: 3,
          }}
        >
          {userRole === 'User' ? 'My 7-Day Activity' : '7-Day Activity Overview'}
        </Typography>

        {/* Chart or Empty State */}
        {chartData.length > 0 ? (
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorAwards" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorRevokes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: 'hsl(var(--muted-foreground))',
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: 'hsl(var(--muted-foreground))',
                  }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <Box
                          sx={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: "var(--radius)",
                            p: 1.5,
                            boxShadow: 2,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'hsl(var(--foreground))',
                              fontWeight: 600,
                              mb: 1,
                            }}
                          >
                            {label}
                          </Typography>
                          {payload.map((entry, index) => (
                            <Typography
                              key={index}
                              variant="body2"
                              sx={{ color: entry.color, fontSize: '0.75rem' }}
                            >
                              {entry.name}: {entry.value}
                            </Typography>
                          ))}
                        </Box>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: '12px',
                    color: 'hsl(var(--muted-foreground))',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="awards"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#colorAwards)"
                  name="Awards"
                />
                <Area
                  type="monotone"
                  dataKey="revokes"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorRevokes)"
                  name="Revokes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box
            sx={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--muted-foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: "var(--radius)",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: 'hsl(var(--muted-foreground))' }}
            >
              No activity data available
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityChartCard;
