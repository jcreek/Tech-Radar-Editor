<svelte:options customElement="tech-radar-editor" />

<style lang="postcss">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>

<script lang="ts">
  interface TechRadarData {
    title: string;
    quadrants: Quadrant[];
    rings: Ring[];
    entries: Entry[];
  }

  interface Quadrant {
    id: string;
    name: string;
    expanded?: boolean;
  }

  interface Ring {
    id: string;
    name: string;
    color: string;
    description?: string;
    expanded?: boolean;
  }

  interface Entry {
    id: string;
    title: string;
    description?: string;
    key: string;
    url?: string;
    quadrant: string;
    timeline: TimelineEntry[];
    expanded?: boolean;
  }

  interface TimelineEntry {
    id: string;
    moved: number; // -1, 0, 1
    ringId: string;
    date: string; // format YYYY-MM-dd
    description: string;
    expanded?: boolean;
  }

  let techRadarData: TechRadarData = {
    title: '',
    quadrants: [],
    rings: [],
    entries: []
  };

  let jsonTextarea: HTMLTextAreaElement;

  let showRings = false;
  let showQuadrants = false;
  let showEntries = false;

  let idCounter = 0;
  function generateId() {
    return `id-${idCounter++}`;
  }

  function updateEntry(updatedEntry: Entry) {
    techRadarData.entries = techRadarData.entries.map(entry =>
      entry.id === updatedEntry.id ? updatedEntry : entry
    );
  }

  function loadJson() {
    try {
      const parsedData = JSON.parse(jsonTextarea.value);

      initializeData(parsedData);

      techRadarData = parsedData;

      showRings = false;
      showQuadrants = false;
      showEntries = false;
    } catch (error) {
      alert('Invalid JSON format');
      console.error(error);
    }
  }

  function initializeData(data: TechRadarData) {
    data.entries.forEach((entry: Entry) => {
      entry.expanded = false;
      if (!entry.timeline) entry.timeline = [];
      entry.timeline.forEach((timelineItem: TimelineEntry) => {
        timelineItem.expanded = false;
        timelineItem.moved = Number(timelineItem.moved);
        if (!timelineItem.id) timelineItem.id = generateId();
      });
      if (!entry.id) entry.id = generateId();
    });

    data.rings.forEach((ring: Ring) => {
      ring.expanded = false;
      if (!ring.id) ring.id = generateId();
    });

    data.quadrants.forEach((quadrant: Quadrant) => {
      quadrant.expanded = false;
      if (!quadrant.id) quadrant.id = generateId();
    });
  }

  function addRing() {
    const newRing: Ring = {
      id: generateId(),
      name: 'New Ring',
      color: '#000000',
      description: '',
      expanded: true
    };
    techRadarData.rings = [...techRadarData.rings, newRing];
  }

  function addQuadrant() {
    const newQuadrant: Quadrant = {
      id: generateId(),
      name: 'New Quadrant',
      expanded: true
    };
    techRadarData.quadrants = [...techRadarData.quadrants, newQuadrant];
  }

  function addEntry() {
    const newEntry: Entry = {
      id: generateId(),
      title: 'New Entry',
      description: '',
      key: 'new-key',
      url: '',
      quadrant: techRadarData.quadrants.length > 0 ? techRadarData.quadrants[0].id : '',
      timeline: [],
      expanded: true
    };
    techRadarData.entries = [...techRadarData.entries, newEntry];
  }

  function addTimelineEntry(entryId: string) {
    const entry = techRadarData.entries.find(e => e.id === entryId);
    if (entry) {
      const newTimelineEntry: TimelineEntry = {
        id: generateId(),
        moved: 0,
        ringId: techRadarData.rings.length > 0 ? techRadarData.rings[0].id : '',
        date: '',
        description: '',
        expanded: true
      };
      entry.timeline = [...entry.timeline, newTimelineEntry];
      updateEntry({ ...entry });
    }
  }

  function removeItem<T>(items: T[], itemId: string): T[] {
    return items.filter((item: any) => item.id !== itemId);
  }

  function removeRing(ringId: string) {
    if (confirm('Are you sure you want to remove this ring?')) {
      techRadarData.rings = removeItem(techRadarData.rings, ringId);
    }
  }

  function removeQuadrant(quadrantId: string) {
    if (confirm('Are you sure you want to remove this quadrant?')) {
      techRadarData.quadrants = removeItem(techRadarData.quadrants, quadrantId);
    }
  }

  function removeEntry(entryId: string) {
    if (confirm('Are you sure you want to remove this entry?')) {
      techRadarData.entries = removeItem(techRadarData.entries, entryId);
    }
  }

  function removeTimelineEntry(entryId: string, timelineItemId: string) {
    const entry = techRadarData.entries.find(e => e.id === entryId);
    if (entry) {
      if (confirm('Are you sure you want to remove this timeline entry?')) {
        entry.timeline = removeItem(entry.timeline, timelineItemId);
        updateEntry({ ...entry });
      }
    }
  }

  function exportJson() {
    // Perform validation
    const validationErrors = validateTechRadarData(techRadarData);

    if (validationErrors.length > 0) {
      alert('Validation errors:\n' + validationErrors.join('\n'));
      return;
    }

    const jsonString = JSON.stringify(techRadarData, null, 2);
    navigator.clipboard.writeText(jsonString)
      .then(() => alert('JSON data has been copied to the clipboard!'))
      .catch(() => alert('Failed to copy JSON data.'));
  }

  function validateTechRadarData(data: TechRadarData): string[] {
    const errors: string[] = [];

    // Validate rings
    data.rings.forEach((ring, index) => {
      if (!ring.id) errors.push(`Ring ${index + 1}: ID is required.`);
      if (!ring.name) errors.push(`Ring ${index + 1}: Name is required.`);
      if (!ring.color) errors.push(`Ring ${index + 1}: Color is required.`);
    });

    // Validate quadrants
    data.quadrants.forEach((quadrant, index) => {
      if (!quadrant.id) errors.push(`Quadrant ${index + 1}: ID is required.`);
      if (!quadrant.name) errors.push(`Quadrant ${index + 1}: Name is required.`);
    });

    // Validate entries
    data.entries.forEach((entry, index) => {
      if (!entry.id) errors.push(`Entry ${index + 1}: ID is required.`);
      if (!entry.title) errors.push(`Entry ${index + 1}: Title is required.`);
      if (!entry.key) errors.push(`Entry ${index + 1}: Key is required.`);
      if (!entry.quadrant) errors.push(`Entry ${index + 1}: Quadrant is required.`);
      if (!entry.timeline || entry.timeline.length === 0) {
        errors.push(`Entry ${index + 1}: At least one timeline entry is required.`);
      } else {
        entry.timeline.forEach((timelineItem, timelineIndex) => {
          if (typeof timelineItem.moved !== 'number') {
            errors.push(`Entry ${index + 1}, Timeline ${timelineIndex + 1}: Moved must be a number.`);
          }
          if (!timelineItem.ringId) {
            errors.push(`Entry ${index + 1}, Timeline ${timelineIndex + 1}: Ring ID is required.`);
          }
          if (!timelineItem.date) {
            errors.push(`Entry ${index + 1}, Timeline ${timelineIndex + 1}: Date is required.`);
          }
          if (!timelineItem.description) {
            errors.push(`Entry ${index + 1}, Timeline ${timelineIndex + 1}: Description is required.`);
          }
        });
      }
    });

    return errors;
  }

  // Reactive statement to update JSON preview whenever techRadarData changes
  $: jsonString = JSON.stringify(techRadarData, null, 2);
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Tech Radar Editor</h1>

  <div class="mb-4">
    <textarea
      bind:this={jsonTextarea}
      class="w-full p-2 border rounded text-black"
      placeholder="Paste your JSON here..."
    ></textarea>
    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2" on:click={loadJson}>
      Load JSON
    </button>
  </div>

  <!-- Rings Section -->
  <h2 class="text-xl font-bold mb-2 flex items-center">
    <button on:click={() => showRings = !showRings} type="button" class="mr-2">
      {#if showRings}
        [-]
      {:else}
        [+]
      {/if}
    </button>
    Rings
  </h2>

  {#if showRings}
    <button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4" on:click={addRing}>
      Add Ring
    </button>

    {#each techRadarData.rings as ring, ringIndex (ring.id)}
      <fieldset class="border p-2 mb-2">
        <legend class="font-bold flex items-center">
          <button on:click={() => ring.expanded = !ring.expanded} type="button" class="mr-2">
            {#if ring.expanded}
              [-]
            {:else}
              [+]
            {/if}
          </button>
          Ring {ringIndex + 1}: {ring.name}
        </legend>

        {#if ring.expanded}
          <label class="block mb-1">
            ID:
            <input type="text" bind:value={ring.id} class="border p-1 w-full text-black"/>
          </label>

          <label class="block mb-1">
            Name:
            <input type="text" bind:value={ring.name} class="border p-1 w-full text-black"/>
          </label>

          <label class="block mb-1">
            Color:
            <input type="color" bind:value={ring.color} class="border p-1 w-full text-black"/>
          </label>

          <label class="block mb-1">
            Description:
            <textarea bind:value={ring.description} class="border p-1 w-full text-black"></textarea>
          </label>

          <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded" on:click={() => removeRing(ring.id)} type="button">Remove Ring</button>
        {/if}
      </fieldset>
    {/each}
  {/if}

  <!-- Quadrants Section -->
  <h2 class="text-xl font-bold mb-2 flex items-center">
    <button on:click={() => showQuadrants = !showQuadrants} type="button" class="mr-2">
      {#if showQuadrants}
        [-]
      {:else}
        [+]
      {/if}
    </button>
    Quadrants
  </h2>

  {#if showQuadrants}
    <button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4" on:click={addQuadrant}>
      Add Quadrant
    </button>

    {#each techRadarData.quadrants as quadrant, quadrantIndex (quadrant.id)}
      <fieldset class="border p-2 mb-2">
        <legend class="font-bold flex items-center">
          <button on:click={() => quadrant.expanded = !quadrant.expanded} type="button" class="mr-2">
            {#if quadrant.expanded}
              [-]
            {:else}
              [+]
            {/if}
          </button>
          Quadrant {quadrantIndex + 1}: {quadrant.name}
        </legend>

        {#if quadrant.expanded}
          <label class="block mb-1">
            ID:
            <input type="text" bind:value={quadrant.id} class="border p-1 w-full text-black"/>
          </label>

          <label class="block mb-1">
            Name:
            <input type="text" bind:value={quadrant.name} class="border p-1 w-full text-black"/>
          </label>

          <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded" on:click={() => removeQuadrant(quadrant.id)} type="button">Remove Quadrant</button>
        {/if}
      </fieldset>
    {/each}
  {/if}

  <!-- Entries Section -->
  <h2 class="text-xl font-bold mb-2 flex items-center">
    <button on:click={() => showEntries = !showEntries} type="button" class="mr-2">
      {#if showEntries}
        [-]
      {:else}
        [+]
      {/if}
    </button>
    Entries
  </h2>

  {#if showEntries}
    <button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4" on:click={addEntry}>
      Add Entry
    </button>

    {#each techRadarData.entries as entry, entryIndex (entry.id)}
      <fieldset class="border p-2 mb-2">
        <legend class="font-bold flex items-center">
          <button on:click={() => entry.expanded = !entry.expanded} type="button" class="mr-2">
            {#if entry.expanded}
              [-]
            {:else}
              [+]
            {/if}
          </button>
          Entry {entryIndex + 1}: {entry.title}
        </legend>

        {#if entry.expanded}
          <label class="block mb-1">
            ID:
            <input type="text" bind:value={entry.id} class="border p-1 w-full text-black"/>
          </label>

          <label class="block mb-1">
            Title:
            <input type="text" bind:value={entry.title} class="border p-1 w-full text-black"/>
          </label>

          <label class="block mb-1">
            Description:
            <textarea bind:value={entry.description} class="border p-1 w-full text-black"></textarea>
          </label>

          <label class="block mb-1">
            Key:
            <input type="text" bind:value={entry.key} class="border p-1 w-full text-black"/>
          </label>

          <label class="block mb-1">
            URL:
            <input type="text" bind:value={entry.url} class="border p-1 w-full text-black"/>
          </label>

          <label class="block mb-1">
            Quadrant:
            <select bind:value={entry.quadrant} class="border p-1 w-full text-black">
              {#each techRadarData.quadrants as quadrant}
                <option value={quadrant.id}>{quadrant.name}</option>
              {/each}
            </select>
          </label>

          <button class="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mb-2" on:click={() => addTimelineEntry(entry.id)} type="button">Add Timeline Entry</button>

          <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded mb-2" on:click={() => removeEntry(entry.id)} type="button">Remove Entry</button>

          <!-- Timeline entries -->
          {#each entry.timeline as timelineItem, timelineIndex (timelineItem.id)}
            <fieldset class="border p-2 mb-2">
              <legend class="font-bold flex items-center">
                <button on:click={() => timelineItem.expanded = !timelineItem.expanded} type="button" class="mr-2">
                  {#if timelineItem.expanded}
                    [-]
                  {:else}
                    [+]
                  {/if}
                </button>
                Timeline {timelineIndex + 1}
              </legend>

              {#if timelineItem.expanded}
                <label class="block mb-1">
                  Moved:
                  <select bind:value={timelineItem.moved} class="border p-1 w-full text-black">
                    <option value={-1}>Moved Out (-1)</option>
                    <option value={0}>Stayed (0)</option>
                    <option value={1}>Moved In (1)</option>
                  </select>
                </label>

                <label class="block mb-1">
                  Ring ID:
                  <select bind:value={timelineItem.ringId} class="border p-1 w-full text-black">
                    {#each techRadarData.rings as ring}
                      <option value={ring.id}>{ring.name}</option>
                    {/each}
                  </select>
                </label>

                <label class="block mb-1">
                  Date:
                  <input type="date" bind:value={timelineItem.date} class="border p-1 w-full text-black"/>
                </label>

                <label class="block mb-1">
                  Description:
                  <textarea bind:value={timelineItem.description} class="border p-1 w-full text-black"></textarea>
                </label>

                <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded" on:click={() => removeTimelineEntry(entry.id, timelineItem.id)} type="button">Remove Timeline Entry</button>
              {/if}
            </fieldset>
          {/each}
        {/if}
      </fieldset>
    {/each}
  {/if}

  <button class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mb-4 mt-4" on:click={exportJson}>
    Export JSON
  </button>

  <h2 class="text-xl font-bold mb-2">JSON Preview:</h2>
  <pre class="p-2 bg-gray-100 rounded text-black">{jsonString}</pre>
</div>
