import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { FloorView } from './components/FloorView';
import { RoomDetail } from './components/RoomDetail';
import { useOutletContext } from 'react-router';
import { Floor } from './data/mockData';

function FloorViewWrapper() {
  const { currentFloor } = useOutletContext<{ currentFloor: Floor | undefined }>();
  
  if (!currentFloor) {
    return (
      <div className="flex items-center justify-center h-full text-cyan-400">
        Loading floor plan...
      </div>
    );
  }

  return <FloorView floor={currentFloor} />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      {
        index: true,
        Component: FloorViewWrapper,
      },
      {
        path: 'room/:floorId/:roomId',
        Component: RoomDetail,
      },
    ],
  },
]);
