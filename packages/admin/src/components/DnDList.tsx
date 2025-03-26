import { IconGripVertical } from "@tabler/icons-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { SectionType } from "../common/database.types";

const reorder = (list: SectionType[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const grid = 8;

const getItemStyle = (draggableStyle: any) => ({
  ...draggableStyle,
});

const getListStyle = (isDraggingOver: boolean) => ({
  background: isDraggingOver ? "rgba(0,0,0,0.05)" : "transparent",
  padding: grid,
});

interface Props {
  children?: React.ReactNode[];
  items: SectionType[];
  onReorder?: (items: SectionType[]) => void;
}

export default function DnDList({ children = [], items, onReorder }: Props) {
  const onDragEnd = (result: DropResult) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const reorderedItems = reorder(
      [...items],
      result.source.index,
      result.destination.index
    );

    onReorder?.(reorderedItems);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={getListStyle(snapshot.isDraggingOver)}
          >
            {children.map((child, index) => (
              <Draggable
                key={items[index]?.["id"] || index}
                draggableId={`${items[index]?.["id"] || index}`}
                index={index}
              >
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "8px",
                      ...getItemStyle(provided.draggableProps.style),
                    }}
                  >
                    <div style={{ width: "30px", flexWrap: "nowrap" }}>
                      <IconGripVertical />
                    </div>
                    <div style={{ flex: 1 }}> {child}</div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
