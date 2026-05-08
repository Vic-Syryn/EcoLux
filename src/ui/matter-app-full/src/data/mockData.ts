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
        id: 'slaapkamer 1',
        name: 'Slaapkamer 1',
        x: 10,
        y: 47.2,
        width: 150.6,
        height: 148.2,
        energyWasters: [
        ]
      },

      {
        id: 'slaapkamer 2',
        name: 'Slaapkamer 2',
        x: 10,
        y: 195.4,
        width: 150.6,
        height: 160.2,
        energyWasters: [
        ]
      },
      {
        id: 'Badkamer',
        name: 'Badkamer',
        x: 160,
        y: 5,
        width: 155.9,
        height: 79.4,
        energyWasters: [
        ]
      },
      {
        id: 'slaapkamer 3',
        name: 'Slaapkamer 3',
        x: 160,
        y: 236.6,
        width: 155.9,
        height: 119.5,
        energyWasters: [
        ]
      },
      {
        id: 'slaapkamer 4',
        name: 'Slaapkamer 4',
        x: 316,
        y: 5,
        width: 153.6,
        height: 289,
        energyWasters: [
        ]
      },
      {
        id: 'Hal',
        name: 'Hal',
        x: 160,
        y: 79.4,
        width: 155.9,
        height: 157.2,
        energyWasters: [
        ]
      },
      {
        id: 'trap',
        name: '',
        x: 257,
        y: 130,
        width: 59,
        height: 106.1,
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
          /*{
            id: 'lr-1',
            name: 'HVAC-systeem',
            type: 'Klimaatbeheersing',
            consumption: '450W continu',
            impact: 'high',
            x: 20,
            y: 20,
            isProblem: HVAC_living
          },*/
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
        name: 'Keuken',
        x: 202.6,
        y: 9.1,
        width: 122.1,
        height: 190.1,
        energyWasters: [
        ]
      },
      {
        id: 'hal',
        name: 'Hal',
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