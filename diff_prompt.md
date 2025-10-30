Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/components/presentation/dashboard/ImageCollectionSelector.tsx
@@
const { communitySets, mySets } = useMemo(() => {

- // If drilling down, show only children of selected parent
- if (drillDownParent) {
-      const children =
-        (drillDownParent.children && drillDownParent.children.length > 0
-          ? drillDownParent.children
-          : imageSets.filter((set) => set.parentId === drillDownParent.id)) ??
-        [];
-      const community: ImageSet[] = [];
-      const mine: ImageSet[] = [];
-      for (const c of children) {
-        if (belongsToUser(c)) {
-          mine.push(c);
-        } else if (
-          // persönliche Sets niemals in Community anzeigen
-          !looksPersonal(c)
-        ) {
-          community.push(c);
-        }
-      }
-      return { communitySets: community, mySets: mine };
- }
-
- const topLevel = drillDownParent
-      ? imageSets.filter((s) => s.parentId === drillDownParent.id)
-      : imageSets.filter((s) => !s.parentId);
- const mine = topLevel.filter(belongsToUser);
- // Community blendet ALLE privat markierten Sets aus
- const community = topLevel.filter((s) => !allOwned.has(s.id));
- return { communitySets: community, mySets: mine };
- }, [belongsToUser, drillDownParent, imageSets, allOwned, looksPersonal]);

* // DRILLDOWN: nur Kinder des gewählten Parents
* if (drillDownParent) {
*      const parentId = drillDownParent?.id ?? null;
*      const children: ImageSet[] =
*        (Array.isArray(drillDownParent.children) && drillDownParent.children.length > 0)
*          ? drillDownParent.children
*          : parentId
*            ? imageSets.filter((set) => set.parentId === parentId)
*            : [];
*
*      const mine = children.filter(belongsToUser);
*      const community = children.filter(
*        (s) =>
*          // absolut keine User-Collections (von irgendwem)
*          !allOwned.has(s.id) &&
*          // keine Personal/Private Tags
*          !looksPersonal(s) &&
*          // AI Avatars niemals in Community
*          !isAiAvatarCollection(s),
*      );
*      return { communitySets: community, mySets: mine };
* }
*
* // TOP-LEVEL: nur Wurzeln
* const topLevel = imageSets.filter((s) => !s.parentId);
* const mine = topLevel.filter(belongsToUser);
* const community = topLevel.filter(
*      (s) =>
*        !allOwned.has(s.id) &&
*        !looksPersonal(s) &&
*        !isAiAvatarCollection(s),
* );
* return { communitySets: community, mySets: mine };
* }, [belongsToUser, drillDownParent, imageSets, allOwned, looksPersonal, isAiAvatarCollection]);
  \*\*\* End Patch
