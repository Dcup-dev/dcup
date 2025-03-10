import { z } from 'zod';

// Match Condition: Supports value, any, except, and text
const MatchCondition = z.union([
  z.object({ value: z.union([z.string(), z.number(), z.boolean()]) }),
  z.object({ any: z.array(z.union([z.string(), z.number()])) }),
  z.object({ except: z.array(z.union([z.string(), z.number()])) }),
  z.object({ text: z.string() }),
]);

// Range Condition: For numerical and datetime ranges
const RangeCondition = z.object({
  gt: z.union([z.number(), z.string()]).nullish(), // String for datetime
  gte: z.union([z.number(), z.string()]).nullish(),
  lt: z.union([z.number(), z.string()]).nullish(),
  lte: z.union([z.number(), z.string()]).nullish(),
}).refine(
  (data) => Object.values(data).some((v) => v !== null && v !== undefined),
  { message: "At least one range parameter must be specified" }
);

// Geo Point: Used in geo conditions
const GeoPoint = z.object({
  lon: z.number(),
  lat: z.number(),
});

// Geo Bounding Box
const GeoBoundingBox = z.object({
  top_left: GeoPoint,
  bottom_right: GeoPoint,
});

// Geo Radius
const GeoRadius = z.object({
  center: GeoPoint,
  radius: z.number(),
});

// Geo Ring: For Geo Polygon
const GeoRing = z.object({
  points: z.array(GeoPoint).min(3), // At least 3 points for a polygon
});

// Geo Polygon
const GeoPolygon = z.object({
  exterior: GeoRing,
  interiors: z.array(GeoRing).optional(),
});

// Specific Conditions: Conditions tied to a key or standalone
const SpecificCondition = z.union([
  // Key-based conditions
  z.object({ key: z.string(), match: MatchCondition }),
  z.object({ key: z.string(), range: RangeCondition }),
  z.object({ key: z.string(), geo_bounding_box: GeoBoundingBox }),
  z.object({ key: z.string(), geo_radius: GeoRadius }),
  z.object({ key: z.string(), geo_polygon: GeoPolygon }),
  z.object({ key: z.string(), values_count: RangeCondition }),
  // Standalone conditions
  z.object({ is_empty: z.object({ key: z.string() }) }),
  z.object({ is_null: z.object({ key: z.string() }) }),
  z.object({ has_id: z.array(z.number()) }),
  z.object({ has_vector: z.string() }),
  // Nested condition (references Filter recursively)
  z.object({
    nested: z.object({
      key: z.string(),
      filter: z.lazy(() => RetrievalFilter),
    }),
  }),
]);

// Filter: The recursive type for logical clauses
export const RetrievalFilter: z.ZodType<any> = z.lazy(() =>
  z.object({
    must: z.array(z.union([SpecificCondition, RetrievalFilter])).optional(),
    should: z.array(z.union([SpecificCondition, RetrievalFilter])).optional(),
    must_not: z.array(z.union([SpecificCondition, RetrievalFilter])).optional(),
  }).refine(
    (data) => Object.values(data).some((v) => v !== undefined && v.length > 0),
    { message: "At least one clause (must, should, or must_not) must be non-empty" }
  )
);
