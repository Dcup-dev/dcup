import { produce } from "immer";



export type FilterGroup = {
  clause: "must" | "should" | "must_not";
  children: FilterChild[];
}

type FilterChild =
  | { type: "condition"; condition: FilterCondition }
  | { type: "group"; group: FilterGroup };

export type FilterCondition =
  | MatchCondition
  | RangeCondition
  | GeoRadiusCondition;

type MatchCondition = {
  type: "match";
  key: string; // e.g., "_metadata.city"
  match:
  | { type: "value"; value: string | number }
  | { type: "any"; values: (string | number)[] }
  | { type: "except"; values: (string | number)[] }
  | { type: "text"; text: string };
}

type RangeCondition = {
  type: "range";
  key: string;
  range: {
    gt?: number;
    gte?: number;
    lt?: number;
    lte?: number;
  };
}

type GeoRadiusCondition = {
  type: "geo_radius";
  key: string;
  geo_radius: {
    center: { lon: number; lat: number };
    radius: number; // in meters
  };
}

export type FilterAction =
  | { type: "set_clause"; path: number[]; clause: "must" | "should" | "must_not" }
  | { type: "add_condition"; path: number[] }
  | { type: "add_group"; path: number[] }
  | { type: "remove_child"; path: number[]; index: number }
  | { type: "update_condition"; path: number[]; condition: FilterCondition }
  | { type: "remove_group"; path: number[] };

const initialFilter: FilterGroup = { clause: "must", children: [] };

export const filterReducer = produce((draft: FilterGroup, action: FilterAction) => {
  const getNode = (node: FilterGroup, path: number[]): FilterGroup => {
    if (path.length === 0) return node;
    const [index, ...rest] = path;
    return getNode((node.children[index] as { type: "group"; group: FilterGroup }).group, rest);
  };

  switch (action.type) {
    case "set_clause":
      getNode(draft, action.path).clause = action.clause;
      break;
    case "add_condition":
      getNode(draft, action.path).children.push({
        type: "condition",
        condition: { type: "match", key: "", match: { type: "value", value: "" } },
      });
      break;
    case "add_group":
      getNode(draft, action.path).children.push({
        type: "group",
        group: { clause: "must", children: [] },
      });
      break;
    case "remove_child":
      getNode(draft, action.path).children.splice(action.index, 1);
      break;
    case "update_condition":
      const parent = getNode(draft, action.path.slice(0, -1));
      const childIndex = action.path[action.path.length - 1];
      (parent.children[childIndex] as { type: "condition"; condition: FilterCondition }).condition =
        action.condition;
      break;

    case "remove_group":
      const parentPath = action.path.slice(0, -1);
      const groupIndex = action.path[action.path.length - 1];
      const node = getNode(draft, parentPath);
      node.children.splice(groupIndex, 1);
      break;
  }
}, initialFilter);


