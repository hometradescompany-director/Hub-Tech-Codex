/** Fail-closed validation for bounded graph references from untrusted discovery inputs. */
export function validateBoundedReferences(edges, allowedNodeIds, maxEdges = 1000) {
  if (!Array.isArray(edges) || !Array.isArray(allowedNodeIds) || !Number.isSafeInteger(maxEdges) || maxEdges < 0 || edges.length > maxEdges)
    return {valid:false,reason:'invalid_bounds'};
  const ids = new Set(allowedNodeIds);
  if (ids.size !== allowedNodeIds.length || [...ids].some(id=>typeof id!=='string'||!id.trim())) return {valid:false,reason:'invalid_nodes'};
  for (const edge of edges) {
    if (!edge || typeof edge!=='object' || Array.isArray(edge) || typeof edge.from!=='string'||typeof edge.to!=='string') return {valid:false,reason:'invalid_edge'};
    if (!ids.has(edge.from)||!ids.has(edge.to)) return {valid:false,reason:'unknown_endpoint'};
  }
  return {valid:true,reason:'valid'};
}
