export interface EnergyWaster {
  id: string;
  name: string;
  type: string;
  consumption: string;
  impact: 'high' | 'medium' | 'low';
  x: number; // Position within the room (percentage)
  y: number; // Position within the room (percentage)
}

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
    id: 'floor-1',
    name: 'Ground Floor',
    level: 1,
    rooms: [
      {
        id: 'living-room',
        name: 'Living Room',
        x: 20,
        y: 20,
        width: 180,
        height: 140,
        energyWasters: [
          {
            id: 'lr-1',
            name: 'Old HVAC System',
            type: 'Climate Control',
            consumption: '450W continuous',
            impact: 'high',
            x: 20,
            y: 20
          },
          {
            id: 'lr-2',
            name: 'Incandescent Bulbs (6x)',
            type: 'Lighting',
            consumption: '360W when on',
            impact: 'medium',
            x: 50,
            y: 15
          },
          {
            id: 'lr-3',
            name: 'TV in Standby Mode',
            type: 'Electronics',
            consumption: '25W continuous',
            impact: 'low',
            x: 75,
            y: 50
          },
          {
            id: 'lr-4',
            name: 'Poor Window Insulation',
            type: 'Insulation',
            consumption: '~200W heat loss',
            impact: 'high',
            x: 85,
            y: 80
          }
        ]
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        x: 220,
        y: 20,
        width: 160,
        height: 100,
        energyWasters: [
          {
            id: 'k-1',
            name: 'Old Refrigerator',
            type: 'Appliance',
            consumption: '180W continuous',
            impact: 'high',
            x: 15,
            y: 25
          },
          {
            id: 'k-2',
            name: 'Halogen Cooktop Lights',
            type: 'Lighting',
            consumption: '120W when on',
            impact: 'medium',
            x: 50,
            y: 60
          },
          {
            id: 'k-3',
            name: 'Dishwasher (Old Model)',
            type: 'Appliance',
            consumption: '1800W per cycle',
            impact: 'medium',
            x: 75,
            y: 30
          }
        ]
      },
      {
        id: 'bathroom',
        name: 'Bathroom',
        x: 220,
        y: 140,
        width: 80,
        height: 80,
        energyWasters: [
          {
            id: 'b-1',
            name: 'Electric Water Heater',
            type: 'Water Heating',
            consumption: '380W continuous',
            impact: 'high',
            x: 30,
            y: 40
          },
          {
            id: 'b-2',
            name: 'Exhaust Fan Running 24/7',
            type: 'Ventilation',
            consumption: '30W continuous',
            impact: 'low',
            x: 70,
            y: 25
          }
        ]
      },
      {
        id: 'hallway',
        name: 'Hallway',
        x: 20,
        y: 180,
        width: 180,
        height: 40,
        energyWasters: [
          {
            id: 'h-1',
            name: 'Lights Left On',
            type: 'Lighting',
            consumption: '90W when on',
            impact: 'medium',
            x: 50,
            y: 50
          }
        ]
      }
    ]
  },
  {
    id: 'floor-2',
    name: 'First Floor',
    level: 2,
    rooms: [
      {
        id: 'master-bedroom',
        name: 'Master Bedroom',
        x: 20,
        y: 20,
        width: 200,
        height: 120,
        energyWasters: [
          {
            id: 'mb-1',
            name: 'Space Heater',
            type: 'Climate Control',
            consumption: '1500W when on',
            impact: 'high',
            x: 20,
            y: 20
          },
          {
            id: 'mb-2',
            name: 'Multiple Phone Chargers',
            type: 'Electronics',
            consumption: '15W continuous',
            impact: 'low',
            x: 50,
            y: 50
          },
          {
            id: 'mb-3',
            name: 'Ceiling Fan (Inefficient)',
            type: 'Climate Control',
            consumption: '75W when on',
            impact: 'medium',
            x: 80,
            y: 80
          }
        ]
      },
      {
        id: 'bedroom-2',
        name: 'Bedroom 2',
        x: 240,
        y: 20,
        width: 140,
        height: 100,
        energyWasters: [
          {
            id: 'b2-1',
            name: 'Gaming PC in Sleep Mode',
            type: 'Electronics',
            consumption: '45W continuous',
            impact: 'medium',
            x: 20,
            y: 20
          },
          {
            id: 'b2-2',
            name: 'Old Window AC Unit',
            type: 'Climate Control',
            consumption: '950W when on',
            impact: 'high',
            x: 50,
            y: 50
          }
        ]
      },
      {
        id: 'office',
        name: 'Home Office',
        x: 20,
        y: 160,
        width: 120,
        height: 100,
        energyWasters: [
          {
            id: 'o-1',
            name: 'Laser Printer Standby',
            type: 'Electronics',
            consumption: '35W continuous',
            impact: 'low',
            x: 20,
            y: 20
          },
          {
            id: 'o-2',
            name: 'Dual Monitors (Old)',
            type: 'Electronics',
            consumption: '120W when on',
            impact: 'medium',
            x: 50,
            y: 50
          },
          {
            id: 'o-3',
            name: 'Desktop Computer',
            type: 'Electronics',
            consumption: '200W when on',
            impact: 'medium',
            x: 80,
            y: 80
          }
        ]
      },
      {
        id: 'upstairs-bathroom',
        name: 'Bathroom',
        x: 240,
        y: 140,
        width: 80,
        height: 120,
        energyWasters: [
          {
            id: 'ub-1',
            name: 'Heat Lamp',
            type: 'Heating',
            consumption: '250W when on',
            impact: 'medium',
            x: 50,
            y: 50
          }
        ]
      }
    ]
  },
  {
    id: 'floor-3',
    name: 'Basement',
    level: 0,
    rooms: [
      {
        id: 'laundry',
        name: 'Laundry Room',
        x: 20,
        y: 20,
        width: 160,
        height: 100,
        energyWasters: [
          {
            id: 'l-1',
            name: 'Old Washing Machine',
            type: 'Appliance',
            consumption: '500W per cycle',
            impact: 'high',
            x: 20,
            y: 20
          },
          {
            id: 'l-2',
            name: 'Electric Dryer',
            type: 'Appliance',
            consumption: '3000W per cycle',
            impact: 'high',
            x: 50,
            y: 50
          },
          {
            id: 'l-3',
            name: 'Dehumidifier',
            type: 'Climate Control',
            consumption: '280W continuous',
            impact: 'medium',
            x: 80,
            y: 80
          }
        ]
      },
      {
        id: 'storage',
        name: 'Storage Area',
        x: 200,
        y: 20,
        width: 180,
        height: 140,
        energyWasters: [
          {
            id: 's-1',
            name: 'Old Freezer',
            type: 'Appliance',
            consumption: '150W continuous',
            impact: 'medium',
            x: 20,
            y: 20
          },
          {
            id: 's-2',
            name: 'Fluorescent Lights',
            type: 'Lighting',
            consumption: '160W when on',
            impact: 'medium',
            x: 50,
            y: 50
          }
        ]
      },
      {
        id: 'utility',
        name: 'Utility Room',
        x: 20,
        y: 140,
        width: 160,
        height: 80,
        energyWasters: [
          {
            id: 'u-1',
            name: 'Water Heater (Tank)',
            type: 'Water Heating',
            consumption: '4500W heating',
            impact: 'high',
            x: 20,
            y: 20
          },
          {
            id: 'u-2',
            name: 'Sump Pump',
            type: 'Utility',
            consumption: '800W when on',
            impact: 'medium',
            x: 50,
            y: 50
          }
        ]
      }
    ]
  }
];