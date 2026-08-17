<script lang="ts">
  /**
   * Märket. Fem kronblad, vit krage, gult öga.
   *
   * Ögat sitter alltid i logotypen — det är undantaget från regeln om att gult
   * bara är markör. Kragen mellan gult och blått är regel 4 och får inte tas bort.
   */
  let { size = 22 }: { size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
  <g fill="var(--color-blue)">
    <circle cx="11" cy="4.6" r="4" />
    <circle cx="17.1" cy="9" r="4" />
    <circle cx="14.8" cy="16.2" r="4" />
    <circle cx="7.2" cy="16.2" r="4" />
    <circle cx="4.9" cy="9" r="4" />
  </g>
  <circle cx="11" cy="11" r="3.9" fill="var(--color-ring)" />
  <circle cx="11" cy="11" r="2.5" fill="var(--color-eye)" />
</svg>
