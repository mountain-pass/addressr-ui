<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { parseHighlight } from '@mountainpass/addressr-core';
import type { AddressDetail } from '@mountainpass/addressr-core';
import { useAddressSearch } from './useAddressSearch';

const props = withDefaults(defineProps<{
  apiKey?: string;
  apiUrl?: string;
  apiHost?: string;
  label?: string;
  placeholder?: string;
  debounceMs?: number;
  fetchImpl?: typeof fetch;
}>(), {
  label: 'Search Australian addresses',
  placeholder: 'Start typing an address...',
});

const emit = defineEmits<{
  select: [address: AddressDetail];
}>();

const uid = `addressr-${Math.random().toString(36).slice(2, 9)}`;
const inputId = `${uid}-input`;
const listboxId = `${uid}-listbox`;
const statusId = `${uid}-status`;
const errorId = `${uid}-error`;

const search = useAddressSearch({
  apiKey: props.apiKey,
  apiUrl: props.apiUrl,
  apiHost: props.apiHost,
  debounceMs: props.debounceMs,
  fetchImpl: props.fetchImpl,
});

const isOpen = ref(false);
const highlightedIndex = ref(-1);

watch(search.selectedAddress, (addr) => {
  if (addr) {
    emit('select', addr);
  }
});

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  search.setQuery(value);
  isOpen.value = true;
  highlightedIndex.value = -1;
}

function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value && event.key === 'ArrowDown') {
    isOpen.value = true;
    return;
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, search.results.value.length - 1);
    if (highlightedIndex.value === search.results.value.length - 1 && search.hasMore.value) {
      search.loadMore();
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1);
  } else if (event.key === 'Enter' && highlightedIndex.value >= 0) {
    event.preventDefault();
    selectItem(highlightedIndex.value);
  } else if (event.key === 'Escape') {
    isOpen.value = false;
    highlightedIndex.value = -1;
  }
}

function selectItem(index: number) {
  const item = search.results.value[index];
  if (item) {
    search.selectAddress(item.pid);
    search.setQuery(item.sla);
    isOpen.value = false;
    highlightedIndex.value = -1;
  }
}

function handleScroll(event: Event) {
  if (!search.hasMore.value || search.isLoadingMore.value) return;
  const el = event.target as HTMLElement;
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
    search.loadMore();
  }
}

function handleBlur() {
  setTimeout(() => { isOpen.value = false; highlightedIndex.value = -1; }, 200);
}

const showMenu = computed(() =>
  isOpen.value && (
    search.results.value.length > 0 ||
    search.isLoading.value ||
    (search.query.value.length >= 3 && !search.isLoading.value)
  )
);

const activeDescendant = computed(() =>
  highlightedIndex.value >= 0 ? `${uid}-option-${highlightedIndex.value}` : undefined
);
</script>

<template>
  <div class="addressr-wrapper">
    <label :for="inputId" class="addressr-label">{{ props.label }}</label>
    <input
      :id="inputId"
      type="text"
      role="combobox"
      autocomplete="off"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      :aria-expanded="showMenu"
      :aria-controls="listboxId"
      :aria-activedescendant="activeDescendant"
      :aria-describedby="search.error.value ? errorId : undefined"
      :placeholder="props.placeholder"
      :value="search.query.value"
      class="addressr-input"
      @input="handleInput"
      @keydown="handleKeydown"
      @blur="handleBlur"
      @focus="search.results.value.length > 0 && (isOpen = true)"
    />

    <div :id="statusId" role="status" aria-live="polite" aria-atomic="true" class="addressr-sr-only">
      <template v-if="search.isLoading.value">Searching addresses...</template>
      <template v-else-if="search.results.value.length > 0">{{ search.results.value.length }} addresses found</template>
      <template v-else-if="search.query.value.length >= 3">No addresses found</template>
    </div>

    <ul
      :id="listboxId"
      role="listbox"
      class="addressr-menu"
      :class="{ 'addressr-menu-hidden': !showMenu }"
      @scroll="handleScroll"
    >
      <template v-if="showMenu">
        <li v-if="search.isLoading.value" class="addressr-loading">Searching...</li>
        <li v-if="!search.isLoading.value && search.results.value.length === 0 && search.query.value.length >= 3" class="addressr-no-results">No addresses found</li>
        <li
          v-for="(item, index) in search.results.value"
          :key="item.pid"
          :id="`${uid}-option-${index}`"
          role="option"
          :aria-selected="highlightedIndex === index"
          class="addressr-item"
          :class="{ 'addressr-item-highlighted': highlightedIndex === index }"
          @click="selectItem(index)"
          @mouseenter="highlightedIndex = index"
        >
          <span>
            <template v-for="(seg, i) in parseHighlight(item.highlight?.sla ?? item.sla)" :key="i">
              <mark v-if="seg.highlighted">{{ seg.text }}</mark>
              <span v-else>{{ seg.text }}</span>
            </template>
          </span>
        </li>
        <li v-if="search.isLoadingMore.value" role="presentation" class="addressr-loading">Loading more...</li>
      </template>
    </ul>

    <div v-if="search.error.value" :id="errorId" class="addressr-error" role="alert" aria-live="assertive" aria-atomic="true">
      {{ search.error.value.message }}
    </div>
  </div>
</template>

<style scoped>
.addressr-wrapper {
  position: relative;
  font-family: system-ui, -apple-system, sans-serif;
}
.addressr-label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  font-size: 0.875rem;
}
.addressr-input {
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border: 1px solid #767676;
  border-radius: 0.25rem;
  box-sizing: border-box;
}
.addressr-input:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 1px;
  border-color: #005fcc;
}
.addressr-menu {
  position: absolute;
  z-index: 1000;
  width: 100%;
  max-height: 20rem;
  overflow-y: auto;
  margin: 0;
  padding: 0;
  list-style: none;
  background: #fff;
  border: 1px solid #767676;
  border-top: none;
  border-radius: 0 0 0.25rem 0.25rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}
.addressr-menu-hidden {
  display: none;
}
.addressr-item {
  min-height: 2.75rem;
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 0.9375rem;
  line-height: 1.4;
}
.addressr-item-highlighted {
  background-color: #e8f0fe;
}
.addressr-item :deep(mark) {
  background-color: transparent;
  font-weight: 700;
  color: inherit;
}
.addressr-no-results {
  padding: 0.625rem 0.75rem;
  color: #555;
  font-style: italic;
  font-size: 0.875rem;
}
.addressr-loading {
  padding: 0.625rem 0.75rem;
  color: #555;
  font-size: 0.875rem;
}
.addressr-error {
  padding: 0.625rem 0.75rem;
  color: #d32f2f;
  font-size: 0.875rem;
}
.addressr-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
