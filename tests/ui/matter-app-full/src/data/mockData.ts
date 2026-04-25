export interface EnergyWaster {
  id: string;
  name: string;
  type: string;
  consumption: string;
  impact: 'high' | 'medium' | 'low';
  x: number; // Position within the room (percentage)
  y: number; // Position within the room (percentage)
  isProblem: boolean; // Whether this is a problematic energy waster
}

const HVAC_living = false;

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  energyWasters: EnergyWaster[];
}

export interface Floor {
  id: string;
  name: string;
  level: number;
  rooms: Room[];
}

export const mockHouseData: Floor[] = [
  {
    id: 'floor-2',
    name: 'Eerste Verdieping',
    level: 2,
    rooms: [
      {
        id: 'master-bedroom',
        name: 'Hoofdslaapkamer',
        x: 20,
        y: 20,
        width: 260,
        height: 155,
        energyWasters: [
        ]
      },
    ]
  },

  {
    id: 'floor-1',
    name: 'Begane Grond',
    level: 1,
    rooms: [
      {
        id: 'Living',
        name: 'Living',
        x: 35.1,
        y: 107.6,
        width: 288.7,
        height: 243.3,
        energyWasters: [
          {
            id: 'lr-1',
            name: 'HVAC-systeem',
            type: 'Klimaatbeheersing',
            consumption: '450W continu',
            impact: 'high',
            x: 20,
            y: 20,
            isProblem: HVAC_living
          },
        ]
      },
      {
        id: 'bureau',
        name: 'Bureau',
        x: 35.5,
        y: 224.7,
        width: 87,
        height: 126.2,
        energyWasters: [
        ]
      },
      {
        id: 'keuken',
        name: 'keuken',
        x: 202.6,
        y: 9.1,
        width: 122.1,
        height: 190.1,
        energyWasters: [
        ]
      },
      {
        id: 'hal',
        name: 'hal',
        x: 235.4,
        y: 199.2,
        width: 40.4,
        height: 151.2,
        energyWasters: [
        ]
      },
      {
        id: 'WC',
        name: 'WC',
        x: 276.6,
        y: 285.1,
        width: 46.5,
        height: 65.6,
        energyWasters: [
        ]
      },
      {
        id: 'Garage',
        name: 'Garage',
        x: 325.1,
        y: 72.9,
        width: 119.8,
        height: 226.2,
        energyWasters: [
        ]
      },
      {
        id: 'trap',
        name: '',
        x: 276.3,
        y: 199.2,
        width: 48.3,
        height: 87.9,
        energyWasters: [
        ]
      },
    ]
  },
];