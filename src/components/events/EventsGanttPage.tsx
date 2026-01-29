// src/components/events/EventsGanttPage.tsx
import React from "react";
import { colors } from "../../theme";

const days = Array.from({ length: 10 }).map((_, i) => `0${i + 1}.02`);
const items = [
  { id: 1, title: "Онбординг менеджеров", start: 1, end: 3 },
  { id: 2, title: "Тренинг по продажам", start: 2, end: 7 },
  { id: 3, title: "Диагностика навыков", start: 5, end: 9 },
];

export const EventsGanttPage: React.FC = () => {
  return (
    <div
      style={{
        background: "#EFF1ED",
        padding: 24,
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          overflowX: "auto",
          paddingBottom: 8,
        }}
      >
        <div style={{ minWidth: 720 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `200px repeat(${days.length}, 1fr)`,
              fontSize: 12,
              position: "sticky",
              top: 0,
              background: "#EFF1ED",
              zIndex: 1,
            }}
          >
            <div />
            {days.map((d) => (
              <div
                key={d}
                style={{
                  padding: "4px 0",
                  textAlign: "center",
                  borderLeft: "1px solid #D0D4C8",
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {items.map((it) => (
            <div
              key={it.id}
              style={{
                display: "grid",
                gridTemplateColumns: `200px repeat(${days.length}, 1fr)`,
                alignItems: "center",
                fontSize: 14,
                height: 40,
              }}
            >
              <div
                style={{
                  paddingRight: 12,
                  whiteSpace: "nowrap",
                }}
              >
                {it.title}
              </div>
              {days.map((_, index) => {
                const dayIndex = index + 1;
                const active =
                  dayIndex >= it.start && dayIndex <= it.end;
                return (
                  <div
                    key={index}
                    style={{
                      position: "relative",
                      borderLeft: "1px solid #D0D4C8",
                      height: 40,
                    }}
                  >
                    {active && dayIndex === it.start && (
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 4,
                          right:
                            4 +
                            (it.end - it.start) * 100 +
                            "%",
                        }}
                      />
                    )}
                    {active && (
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          left: dayIndex === it.start ? 4 : -4,
                          right:
                            dayIndex === it.end
                              ? 4
                              : -(4 + (it.end - dayIndex) * 100),
                          borderRadius: 999,
                          background: "#5A6650",
                          color: "#F7F8F5",
                          fontSize: 12,
                          padding: "4px 10px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={it.title}
                      >
                        {it.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
