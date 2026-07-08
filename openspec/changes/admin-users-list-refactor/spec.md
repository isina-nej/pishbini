# Admin Users List Refactor

## Proposal
The current admin users list (`/admin/users`) has bugs, misaligned data, and performance limitations (hardcapped at 500 records before processing). We need to refactor it to:
1. Load all users seamlessly without hard limits.
2. Ensure point calculations match database records accurately.
3. Cache the users list in memory on the server.
4. Update the cache in the background when new users arrive.
5. Provide filtering and sorting capabilities on the admin UI.

## Design
1. **Caching Layer (`lib/admin-cache.ts`)**: 
   - Maintain an in-memory array of computed user data.
   - Run a background interval to fetch and compute scores periodically (or invalidate on new user creation).
2. **API Endpoint (`app/api/admin/users/route.ts`)**:
   - Serve data directly from the in-memory cache to ensure instant load times without DB bottleneck.
   - Handle filtering and sorting against the cached array.
3. **UI Updates (`app/admin/users/page.tsx`)**:
   - Render the full cached list.
   - Add client-side or server-driven sort controls (Name, Points, Date, etc.).

## Tasks
- [ ] Create `lib/admin-cache.ts` for background user fetching and score computation.
- [ ] Update `app/api/admin/users/route.ts` to utilize the cache and support sort parameters.
- [ ] Update `app/admin/users/page.tsx` to handle the new payload structure, sorting UI, and filter inputs.

## Specs
- Affects `openspec/specs/admin-management-panel/spec.md` (Update data source reference for users list).