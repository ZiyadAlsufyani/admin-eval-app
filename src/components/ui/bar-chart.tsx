import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface ChartData {
  label: string;
  value: number;
  id: string;
}

interface BarChartProps {
  data: ChartData[];
  barColor?: string; // Hex color for the bar
  height?: number;
}

export function BarChart({ data, barColor = 'hsl(var(--primary))', height = 240 }: BarChartProps) {
  return (
    <div style={{ width: '100%', height: height }}>
      <ResponsiveContainer>
        <RechartsBarChart
          data={data}
          margin={{ top: 20, right: 0, left: -25, bottom: 0 }}
        >
          {/* Architectural Dossier rule: ghost borders / minimal lines */}
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
          
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'hsl(var(--secondary))', fontSize: 12, fontFamily: 'Cairo' }}
            dy={10}
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'hsl(var(--secondary))', fontSize: 12, fontFamily: 'Cairo' }}
            domain={[0, 100]}
            allowDataOverflow
          />
          
          <Tooltip 
            cursor={{ fill: 'hsl(var(--surface-container-low))' }}
            contentStyle={{
              backgroundColor: 'hsl(var(--surface-container-lowest))',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 4px 12px rgba(11,28,48,0.06)',
              fontFamily: 'Cairo'
            }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
          />

          <Bar 
            dataKey="value" 
            radius={[4, 4, 0, 0]}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColor} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
