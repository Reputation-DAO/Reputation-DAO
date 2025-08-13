# Decay System Components

This directory contains all the React components for the Reputation DAO's point decay system. The decay system automatically reduces reputation points over time to encourage continued participation and maintain system balance.

## Components Overview

### Core Components

1. **DecayStatusCard** - User-facing status display
2. **DecayConfigPanel** - Admin configuration interface
3. **DecayTransactionFilter** - Transaction history with filtering
4. **DecayAnalytics** - Admin analytics dashboard
5. **DecayHistoryChart** - Visual decay trend analysis
6. **DecayDashboard** - Complete integrated dashboard

## Quick Start

```tsx
import { DecayDashboard } from '@/components/decay';

// Complete dashboard with all features
function MyPage() {
  return <DecayDashboard />;
}
```

## Individual Component Usage

### DecayStatusCard
Shows the current user's decay status, next decay date, and balance projections.

```tsx
import { DecayStatusCard } from '@/components/decay';

<DecayStatusCard />
```

### DecayConfigPanel (Admin Only)
Allows administrators to configure decay parameters.

```tsx
import { DecayConfigPanel } from '@/components/decay';

<DecayConfigPanel />
```

### DecayTransactionFilter
Displays and filters transaction history, with option to show only decay transactions.

```tsx
import { DecayTransactionFilter } from '@/components/decay';

// Show all transactions
<DecayTransactionFilter />

// Show only decay transactions
<DecayTransactionFilter showOnlyDecay={true} />

// Show specific user's transactions
<DecayTransactionFilter userId="user-principal-id" />
```

### DecayAnalytics (Admin Only)
Comprehensive analytics dashboard showing system-wide decay statistics.

```tsx
import { DecayAnalytics } from '@/components/decay';

<DecayAnalytics />
```

### DecayHistoryChart (Admin Only)
Interactive charts showing decay trends over time.

```tsx
import { DecayHistoryChart } from '@/components/decay';

<DecayHistoryChart />
```

## Features

### User Features
- **Real-time Status**: See current decay status and next decay date
- **Balance Projections**: View how balance will change over time
- **Transaction History**: Browse personal decay events
- **Responsive Design**: Works on all device sizes

### Admin Features
- **System Configuration**: Adjust decay rates, grace periods, minimum thresholds
- **Analytics Dashboard**: Monitor system health and user impact
- **Trend Visualization**: Charts showing decay patterns over time
- **User Risk Analysis**: Identify users at risk of losing all points
- **Bulk Operations**: Process decay for all users simultaneously

### Technical Features
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Comprehensive error states and loading indicators
- **Performance**: Optimized with React best practices
- **Accessibility**: WCAG compliant components
- **Theming**: Integrates with MUI theme system

## Backend Integration

These components work with the Motoko canister's decay system functions:

```motoko
// Key backend functions used:
- getDecayConfig()
- getUserDecayInfo(userId)
- calculateDecayAmount(userId)
- getDecayAnalytics()
- updateDecayConfig(config)
- processDecayForAllUsers()
```

## Configuration Options

The decay system supports these configuration parameters:

```typescript
interface DecayConfig {
  decayRatePerSecond: number;     // Points decayed per second
  gracePeriodDays: number;        // Days before decay starts
  minimumBalance: number;         // Minimum points to maintain
  enabled: boolean;               // System-wide on/off switch
  maxDecayPerPeriod: number;      // Maximum points lost per period
}
```

## Styling and Theming

All components use MUI's theming system. Key theme colors used:

- `warning.main` - Decay events and warnings
- `error.main` - Critical states and point losses
- `success.main` - Grace periods and positive states
- `info.main` - General information and statistics

## Error Handling

Components include comprehensive error handling:

- Network connectivity issues
- Canister availability problems
- Permission/role-based access errors
- Data validation and type safety

## Performance Considerations

- Components use React.memo where appropriate
- Large data sets are paginated or virtualized
- Charts are rendered efficiently with Recharts
- API calls are debounced and cached when possible

## Future Enhancements

Planned improvements include:

1. **Real-time Updates**: WebSocket integration for live decay events
2. **Advanced Analytics**: Machine learning insights and predictions
3. **Mobile App**: React Native versions of core components
4. **Export Features**: CSV/PDF export for all data views
5. **Notifications**: Email/push alerts for decay events

## Contributing

When adding new decay-related features:

1. Follow the existing component structure
2. Include proper TypeScript types
3. Add comprehensive error handling
4. Include loading states and user feedback
5. Update this README with new functionality

## Dependencies

Main external dependencies:

- `@mui/material` - UI components
- `@mui/icons-material` - Icons
- `recharts` - Chart visualizations
- `@dfinity/principal` - Internet Computer integration

These components are designed to work seamlessly with the existing Reputation DAO architecture while providing a comprehensive decay management experience.
