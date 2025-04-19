"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { X, Plus, ChevronDown } from "lucide-react";
import { useQueryContext } from "@/context/queryContext";
import { FilterAction, FilterCondition, FilterGroup } from "@/hooks/use-query";

export default function FilterBuilder() {
  const { filter, filterDispatch } = useQueryContext()

  return (
    <div className="space-y-4">
      <FilterGroupComponent group={filter} path={[]} dispatch={filterDispatch} />
      <DisplayFilter filter={filter} />
    </div>
  );
}

// Recursive FilterGroup component
interface FilterGroupProps {
  group: FilterGroup;
  path: number[];
  dispatch: React.Dispatch<FilterAction>;
}

function FilterGroupComponent({ group, path, dispatch }: FilterGroupProps) {
  return (
    <div className="border p-4 rounded-md space-y-2">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              {group.clause.toUpperCase()}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["must", "should", "must_not"].map((clause) => (
              <DropdownMenuItem
                key={clause}
                onSelect={() =>
                  dispatch({ type: "set_clause", path, clause: clause as "must" | "should" | "must_not" })
                }
              >
                {clause.toUpperCase()}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dispatch({ type: "add_condition", path })}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Condition
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dispatch({ type: "add_group", path })}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Group
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dispatch({ type: "remove_group", path })}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2 ml-4">
        {group.children.map((child, index) =>
          child.type === "condition" ? (
            <FilterConditionComponent
              key={index}
              condition={child.condition}
              path={[...path, index]}
              dispatch={dispatch}
              onRemove={() => dispatch({ type: "remove_child", path, index })}
            />
          ) : (
            <FilterGroupComponent
              key={index}
              group={child.group}
              path={[...path, index]}
              dispatch={dispatch}
            />
          )
        )}
      </div>
    </div>
  );
}

// FilterCondition component
interface FilterConditionProps {
  condition: FilterCondition;
  path: number[];
  dispatch: React.Dispatch<FilterAction>;
  onRemove: () => void;
}

function FilterConditionComponent({ condition, path, dispatch, onRemove }: FilterConditionProps) {
  const updateCondition = (newCondition: FilterCondition) => {
    dispatch({ type: "update_condition", path, condition: newCondition });
  };

  return (
    <div className="flex items-center gap-2 border p-2 rounded-md">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            {condition.type.toUpperCase().replace("_", " ")}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {["match", "range", "geo_radius"].map((type) => (
            <DropdownMenuItem
              key={type}
              onSelect={() => {
                let newCondition: FilterCondition;
                switch (type) {
                  case "match":
                    newCondition = { type: "match", key: "", match: { type: "value", value: "" } };
                    break;
                  case "range":
                    newCondition = { type: "range", key: "", range: {} };
                    break;
                  case "geo_radius":
                    newCondition = {
                      type: "geo_radius",
                      key: "",
                      geo_radius: { center: { lon: 0, lat: 0 }, radius: 0 },
                    };
                    break;
                  default:
                    return;
                }
                updateCondition(newCondition);
              }}
            >
              {type.toUpperCase().replace("_", " ")}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Input
        placeholder="Key (e.g., _metadata.city)"
        value={condition.key}
        onChange={(e) => updateCondition({ ...condition, key: e.target.value })}
        className="w-40"
      />
      {condition.type === "match" && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {condition.match.type.toUpperCase()}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {["value", "any", "except", "text"].map((matchType) => (
                <DropdownMenuItem
                  key={matchType}
                  onSelect={() => {
                    let newMatch:
                      | { type: "value"; value: string | number }
                      | { type: "any"; values: (string | number)[] }
                      | { type: "except"; values: (string | number)[] }
                      | { type: "text"; text: string };
                    switch (matchType) {
                      case "value":
                        newMatch = { type: "value", value: "" };
                        break;
                      case "any":
                        newMatch = { type: "any", values: [] };
                        break;
                      case "except":
                        newMatch = { type: "except", values: [] };
                        break;
                      case "text":
                        newMatch = { type: "text", text: "" };
                        break;
                      default:
                        return;
                    }
                    updateCondition({ ...condition, match: newMatch });
                  }}
                >
                  {matchType.toUpperCase()}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {condition.match.type === "value" && (
            <Input
              placeholder="Value"
              value={condition.match.value}
              onChange={(e) =>
                updateCondition({
                  ...condition,
                  match: { type: "value", value: e.target.value },
                })
              }
            />
          )}
          {(condition.match.type === "any") && (
            <Input
              placeholder="Comma-separated values"
              value={condition.match.values.join(",")}
              onChange={(e) =>
                updateCondition({
                  ...condition,
                  match: {
                    type: "any",
                    values: e.target.value.split(",").map((v) => v.trim()),
                  },
                })
              }
            />
          )}
          {(condition.match.type === "except") && (
            <Input
              placeholder="Comma-separated values"
              value={condition.match.values.join(",")}
              onChange={(e) =>
                updateCondition({
                  ...condition,
                  match: {
                    type: "except",
                    values: e.target.value.split(",").map((v) => v.trim()),
                  },
                })
              }
            />
          )}
          {condition.match.type === "text" && (
            <Input
              placeholder="Search text"
              value={condition.match.text}
              onChange={(e) =>
                updateCondition({
                  ...condition,
                  match: { type: "text", text: e.target.value },
                })
              }
            />
          )}
        </>
      )}
      {condition.type === "range" && (
        <div className="flex gap-2">
          <Input
            placeholder="GT"
            value={condition.range.gt ?? ""}
            onChange={(e) =>
              updateCondition({
                ...condition,
                range: { ...condition.range, gt: e.target.value ? Number(e.target.value) : undefined },
              })
            }
            type="number"
          />
          <Input
            placeholder="GTE"
            value={condition.range.gte ?? ""}
            onChange={(e) =>
              updateCondition({
                ...condition,
                range: { ...condition.range, gte: e.target.value ? Number(e.target.value) : undefined },
              })
            }
            type="number"
          />
          <Input
            placeholder="LT"
            value={condition.range.lt ?? ""}
            onChange={(e) =>
              updateCondition({
                ...condition,
                range: { ...condition.range, lt: e.target.value ? Number(e.target.value) : undefined },
              })
            }
            type="number"
          />
          <Input
            placeholder="LTE"
            value={condition.range.lte ?? ""}
            onChange={(e) =>
              updateCondition({
                ...condition,
                range: { ...condition.range, lte: e.target.value ? Number(e.target.value) : undefined },
              })
            }
            type="number"
          />
        </div>
      )}
      {condition.type === "geo_radius" && (
        <div className="flex gap-2">
          <Input
            placeholder="Lon"
            value={condition.geo_radius.center.lon}
            onChange={(e) =>
              updateCondition({
                ...condition,
                geo_radius: {
                  ...condition.geo_radius,
                  center: { ...condition.geo_radius.center, lon: Number(e.target.value) },
                },
              })
            }
            type="number"
          />
          <Input
            placeholder="Lat"
            value={condition.geo_radius.center.lat}
            onChange={(e) =>
              updateCondition({
                ...condition,
                geo_radius: {
                  ...condition.geo_radius,
                  center: { ...condition.geo_radius.center, lat: Number(e.target.value) },
                },
              })
            }
            type="number"
          />
          <Input
            placeholder="Radius (m)"
            value={condition.geo_radius.radius}
            onChange={(e) =>
              updateCondition({
                ...condition,
                geo_radius: { ...condition.geo_radius, radius: Number(e.target.value) },
              })
            }
            type="number"
          />
        </div>
      )}
      <Button variant="ghost" size="sm" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Display current filter structure
function DisplayFilter({ filter }: { filter: FilterGroup }) {
  const renderFilter = (group: FilterGroup, indent = 0): JSX.Element => {
    const padding = " ".repeat(indent * 2);
    return (
      <div>
        <div>{padding}{group.clause.toUpperCase()}:</div>
        {group.children.map((child, index) =>
          child.type === "condition" ? (
            <div key={index}>
              {padding}  {renderCondition(child.condition)}
            </div>
          ) : (
            <div key={index}>{renderFilter(child.group, indent + 1)}</div>
          )
        )}
      </div>
    );
  };

  const renderCondition = (condition: FilterCondition): string => {
    switch (condition.type) {
      case "match":
        if (condition.match.type === "value") return `Match: ${condition.key} = ${condition.match.value}`;
        if (condition.match.type === "any") return `Match: ${condition.key} IN [${condition.match.values.join(", ")}]`;
        if (condition.match.type === "except") return `Match: ${condition.key} NOT IN [${condition.match.values.join(", ")}]`;
        if (condition.match.type === "text") return `Match: ${condition.key} CONTAINS "${condition.match.text}"`;
        break;
      case "range":
        return `Range: ${condition.key} ${condition.range.gt ? "> " + condition.range.gt : ""} ${condition.range.gte ? ">= " + condition.range.gte : ""
          } ${condition.range.lt ? "< " + condition.range.lt : ""} ${condition.range.lte ? "<= " + condition.range.lte : ""
          }`;
      case "geo_radius":
        return `Geo Radius: ${condition.key} at (${condition.geo_radius.center.lon}, ${condition.geo_radius.center.lat
          }), radius ${condition.geo_radius.radius}m`;
    }
    return "";
  };

  return (
    <div className="mt-4 p-4 border rounded-md">
      <h3 className="font-semibold">Current Filter:</h3>
      {filter.children.length > 0 ? (
        <pre>{renderFilter(filter)}</pre>
      ) : (
        <p>No filters applied</p>
      )}
    </div>
  );
}
