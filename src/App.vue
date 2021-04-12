<template>
  <v-app id="inspire">
    <v-overlay :value="loading" z-index="1001">
      <v-progress-circular
        indeterminate
        size="58"
        width="5"
      ></v-progress-circular>
    </v-overlay>

    <v-tooltip right v-if="!drawer">
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          style="position: fixed; bottom: 8px; left: 8px; z-index: 20"
          icon
          class="text-center mx-auto mb-2"
          color="indigo"
          dark
          size="28"
          v-bind="attrs"
          v-on="on"
          @click="drawer = !drawer"
        >
          <v-icon>mdi-chevron-double-right</v-icon>
        </v-btn>
      </template>
      <span>Show Actions</span>
    </v-tooltip>

    <v-tooltip left v-if="!historyDrawer">
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          style="position: fixed; bottom: 8px; right: 8px; z-index: 20"
          icon
          class="text-center mx-auto mb-2"
          color="indigo darken-2"
          dark
          size="28"
          v-bind="attrs"
          v-on="on"
          @click="historyDrawer = !historyDrawer"
        >
          <v-icon>mdi-history</v-icon>
        </v-btn>
      </template>
      <span>Show History</span>
    </v-tooltip>

    <v-system-bar app>
      <span>Wind Waker UI</span>
      <v-spacer></v-spacer>
      <span v-if="cooldown">
        Starting server..., retrying in {{ cooldown }} seconds.
      </span>
      <v-icon color="red darken-2" v-if="networkError"
        >mdi-power-plug-off</v-icon
      >
      <v-icon color="green darken-2" v-if="!networkError">mdi-server</v-icon>
      <v-text-field
        class="base-url"
        single-line
        dense
        v-model="baseUrl"
        @keypress.enter="sync()"
      ></v-text-field>
      <span style="cursor: pointer; user-select: none" @click="sync()">
        <v-icon color="orange darken-2">mdi-cached</v-icon>sync
      </span>
    </v-system-bar>
    <v-app-bar app clipped-right flat height="56">
      <v-icon
        v-if="selected.name"
        class="rotate-z-90"
        v-text="icon"
        color="orange darken-2"
      ></v-icon>
      <div class="pl-2">{{ selected.name }}</div>

      <v-spacer></v-spacer>

      <div>
        <v-btn
          :loading="loading"
          color="orange darken-2"
          class="white--text"
          :disabled="!selected.name"
          @click="execute()"
        >
          Send
          <v-icon right>mdi-rocket-launch</v-icon>
        </v-btn>
      </div>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      app
      width="300"
      class="hide-overlay-scrim"
    >
      <v-navigation-drawer
        v-model="drawer"
        absolute
        color="grey lighten-3"
        mini-variant
      >
        <v-avatar
          class="d-block text-center mx-auto mt-1"
          color="grey darken-1"
          size="44"
        >
          <img src="./assets/logo.png" alt="wind-waker" />
        </v-avatar>

        <v-divider class="mx-3 my-2"></v-divider>

        <div
          class="d-flex flex-column-reverse align-center"
          style="height: calc(100% - 65px)"
        >
          <v-btn
            icon
            class="text-center mx-auto mb-2"
            color="indigo darken-2"
            size="28"
            @click="drawer = !drawer"
          >
            <v-icon dark> mdi-chevron-double-left </v-icon>
          </v-btn>

          <v-tooltip right>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                icon
                href="https://github.com/Cervantes007/wind-waker"
                target="_blank"
                class="text-center mx-auto mb-3"
                color="indigo darken-2"
                v-bind="attrs"
                v-on="on"
                size="28"
              >
                <v-icon dark> mdi-github </v-icon>
              </v-btn>
            </template>
            <span>Github</span>
          </v-tooltip>

          <v-tooltip right>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                icon
                href="https://cervantes007.github.io/wind-waker/"
                class="text-center mx-auto mb-3"
                color="indigo darken-2"
                v-bind="attrs"
                v-on="on"
                size="28"
              >
                <v-icon dark> mdi-feather </v-icon>
              </v-btn>
            </template>
            <span>Documentation</span>
          </v-tooltip>
        </div>
      </v-navigation-drawer>

      <v-sheet
        class="pl-14 p d-flex justify-end align-center"
        color="grey lighten-5"
        height="56"
        width="100%"
      >
        <div class="pl-2 pr-2">
          <v-responsive>
            <v-text-field
              id="find-action"
              hide-details
              v-model="filter"
              dense
              outlined
              clearable
              placeholder="Find action     Ctrl+B"
            ></v-text-field>
          </v-responsive>
        </div>
      </v-sheet>

      <v-list class="pl-14" flat dense>
        <v-list-item-group v-model="model" color="orange darken-2">
          <v-list-item
            v-for="(item, i) in filterActions()"
            :key="i"
            @click="select(item)"
          >
            <v-list-item-icon>
              <v-icon
                :class="{ 'rotate-z-90': i == model }"
                color="orange darken-2"
                v-text="icon"
              ></v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title v-text="item.name"></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-navigation-drawer v-model="historyDrawer" app clipped right>
      <v-system-bar>
        <v-icon color="orange darken-2">mdi-history</v-icon>
        <span>History</span>
        <v-spacer></v-spacer>

        <v-icon color="indigo" dark @click="historyDrawer = !historyDrawer">
          mdi-chevron-double-right
        </v-icon>
      </v-system-bar>
      <v-list dense flat>
        <v-list-item-group color="primary">
          <template v-for="(archivedRequest, i) in history">
            <v-list-item
              link
              :key="archivedRequest + i"
              @click="restoreRequest(archivedRequest)"
            >
              <template v-slot:default>
                <v-list-item-content>
                  <v-list-item-title
                    ><v-icon
                      class="rotate-z-90"
                      v-text="icon"
                      small
                      color="orange darken-2"
                    ></v-icon>
                    {{ archivedRequest.selected.name }}</v-list-item-title
                  >
                  <v-list-item-subtitle>
                    <div class="d-flex justify-space-between align-center mt">
                      <span>
                        <v-icon x-small color="grey">mdi-alarm</v-icon>
                        {{ archivedRequest.responseTime }}
                      </span>

                      <v-chip
                        x-small
                        :color="getStatusColor(archivedRequest.response.status)"
                        text-color="white"
                      >
                        {{ archivedRequest.response.status }}
                      </v-chip>
                    </div>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </template>
            </v-list-item>
            <v-divider :key="i"></v-divider>
          </template>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <div
        class="d-flex"
        :class="{ 'flex-column': displayVertical }"
        style="height: 100%; width: 100%"
      >
        <div style="flex: 1 1 0">
          <v-system-bar light>
            <span>Request</span>
            <v-spacer></v-spacer>

            <v-icon
              @click="displayVertical = true"
              :color="displayVertical ? 'orange' : ''"
              >mdi-arrow-split-vertical</v-icon
            >
            <v-icon
              @click="displayVertical = false"
              :color="!displayVertical ? 'orange' : ''"
              >mdi-arrow-split-horizontal</v-icon
            >

            <v-icon
              color="indigo darken-2"
              v-if="!historyDrawer"
              @click="historyDrawer = true"
              >mdi-history</v-icon
            >
          </v-system-bar>

          <div>
            <v-tabs v-model="tab" grow>
              <v-tab>
                <v-badge
                  color="orange darken-2"
                  :content="getKeysNumber(inputs)"
                  :value="getKeysNumber(inputs)"
                >
                  Inputs
                </v-badge>
              </v-tab>
              <v-tab>
                <v-badge
                  color="orange darken-2"
                  :content="getKeysNumber(headers)"
                  :value="getKeysNumber(headers)"
                >
                  Headers
                </v-badge>
              </v-tab>
            </v-tabs>

            <v-tabs-items v-model="tab">
              <v-tab-item>
                <div
                  :style="{
                    height: displayVertical ? '40vh' : 'calc(100vh - 153px)',
                  }"
                >
                  <v-jsoneditor
                    v-model="inputs"
                    :options="jsonViewOptions"
                    height="100%"
                  ></v-jsoneditor>
                </div>
              </v-tab-item>
              <v-tab-item>
                <div
                  :style="{
                    height: displayVertical ? '40vh' : 'calc(100vh - 153px)',
                  }"
                >
                  <v-jsoneditor
                    v-model="headers"
                    :options="jsonViewOptions"
                    height="100%"
                  ></v-jsoneditor>
                </div>
              </v-tab-item>
            </v-tabs-items>
          </div>
        </div>
        <div style="flex: 1 1 0" v-if="response">
          <v-system-bar light>
            <span>Response</span>
            <v-spacer></v-spacer>
            <span>
              <v-icon x-small color="gray lighten-1">mdi-alarm</v-icon>
              {{ responseTime }}
            </span>

            <v-chip
              x-small
              class="ma-2"
              :color="getStatusColor(response.status)"
              text-color="white"
            >
              {{ response.status }}
            </v-chip>

            <v-icon color="red darken-2" v-if="networkError"
              >mdi-power-plug-off</v-icon
            >
          </v-system-bar>
          <div style="height: calc(100% - 24px)">
            <v-jsoneditor
              v-model="response.data"
              :options="jsonViewOptions"
              height="100%"
            ></v-jsoneditor>
          </div>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import { request } from "./client/client";
import "vue-json-pretty/lib/styles.css";
import VJsoneditor from "v-jsoneditor";

export default Vue.extend({
  name: "App",
  components: {
    VJsoneditor,
  },
  data: () => ({
    jsonViewOptions: {
      mode: "code",
    },
    networkError: false,
    drawer: null,
    responseTime: "",
    tab: null,
    filter: "",
    items: ["Inputs", "Headers"],
    displayVertical: true,
    historyDrawer: null,
    icon: "mdi-arrow-decision-outline",
    baseUrl: "http://localhost:4000",
    headers: {},
    inputs: {},
    model: 0,
    requests: [],
    selected: {},
    response: null,
    history: [],
    loading: false,
    retries: 0,
    cooldown: 0,
    cooldownInterval: null,
    retryTimeout: null,
  }),
  mounted() {
    this.sync();
    window.addEventListener("keyup", this.enterListener);
  },
  beforeDestroy() {
    window.removeEventListener("keyup", this.enterListener);
  },
  methods: {
    sync(retring = false) {
      this.requests = [];
      this.loading = true;
      this.networkError = false;
      if (this.retryTimeout && !retring) {
        clearTimeout(this.retryTimeout!);
      }
      request("wwActions", { baseURL: this.baseUrl })
        .then((r) => {
          this.requests = (r.data || []).filter(
            (action: any) => action.name !== "/wwActions"
          );
          if (!(this.selected as any).name && this.requests.length > 0) {
            this.selected = this.requests[0];
          }
        })
        .catch((r: any) => {
          if (r.response) {
            return;
          }
          if (r.message === "Network Error") {
            this.networkError = true;
          }
          if (this.retries <= 3) {
            const time = this.retries === 0 ? 5000 : this.retries * 10000;
            this.cooldown = this.retries === 0 ? 5 : this.retries * 10;
            this.retries++;
            (this.retryTimeout as any) = setTimeout(() => this.sync(), time);
            if (this.cooldownInterval) {
              clearInterval(this.cooldownInterval!);
            }
            (this.cooldownInterval as any) = setInterval(() => {
              this.cooldown = this.cooldown - 1;
              if (this.cooldown === 0 && this.cooldownInterval) {
                clearInterval(this.cooldownInterval!);
              }
            }, 1000);
          }
        })
        .finally(() => {
          setTimeout(() => (this.loading = false), 750);
        });
    },
    filterActions() {
      if (this.filter) {
        const filterLower = (this.filter || "").toLowerCase();
        return this.requests.filter((request: any) => {
          return request.name.toLowerCase().includes(filterLower);
        });
      }
      return this.requests;
    },
    execute() {
      const name = (this.selected as any).name;
      if (name) {
        this.response = null;
        this.responseTime = "";
        const data = this.inputs || {};
        const headers = this.headers || {};
        const config = { headers, data, baseURL: this.baseUrl };
        this.loading = true;
        this.networkError = false;
        const startTime = new Date().getTime();
        request(name, config)
          .then((r: any) => {
            this.responseTime = `${new Date().getTime() - startTime}ms`;
            this.response = r;
            this.addToHistory();
          })
          .catch((r: any) => {
            this.responseTime = `${new Date().getTime() - startTime}ms`;
            if (r.response) {
              this.response = r.response;
              this.addToHistory();
            } else if (r.request) {
              // The request was made but no response was received
              this.networkError = true;
            } else {
              // Something happened in setting up the request that triggered an Error
              this.networkError = true;
            }
          })
          .finally(() => {
            setTimeout(() => (this.loading = false), 750);
          });
      }
    },
    addToHistory() {
      const { selected, inputs, headers, response, responseTime } = this;
      const archivedRequest = {
        selected,
        inputs: inputs || {},
        headers: headers || {},
        response,
        responseTime,
      };
      (this.history as any).unshift({
        ...archivedRequest,
      });
    },
    restoreRequest(archivedRequest) {
      this.inputs = {};
      const {
        selected,
        inputs,
        headers,
        response,
        responseTime,
      } = archivedRequest;
      this.selected = selected;
      this.inputs = inputs;
      this.headers = headers;
      this.response = response as any;
      this.responseTime = responseTime;
    },
    select(request: any) {
      if (request !== this.selected) {
        this.response = null;
      }
      this.selected = request;
    },
    enterListener(e: KeyboardEvent) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (e.ctrlKey && e.keyCode == 13) {
        this.execute();
      }

      if (e.ctrlKey && e.keyCode == 66) {
        document.getElementById("find-action")!.focus();
      }
    },
    getStatusColor(status) {
      if (!status || typeof status !== "number") {
        return "gray";
      }
      if (status >= 200 && status < 300) {
        return "green darken-2";
      }
      if (status >= 300 && status < 400) {
        return "orange darken-2";
      }
      if (status >= 400) {
        return "red darken-2";
      }
      return "gray";
    },
    getKeysNumber(obj = {}) {
      if (!obj) {
        return 0;
      }
      return (Object.keys(obj) || []).length;
    },
  },
});
</script>

<style>
.rotate-z-90 {
  transform: rotateZ(90deg);
}

.base-url {
  max-width: 300px !important;
  margin-bottom: -4px;
}

.base-url .v-input__slot {
  margin-bottom: 0 !important;
}

.base-url input {
  padding-bottom: 0 !important;
  font-size: 13px !important;
}

.hide-overlay-scrim .v-overlay--absolute {
  display: none !important;
  visibility: hidden;
}

.jsoneditor {
  border: none !important;
}

.jsoneditor .jsoneditor-poweredBy {
  color: white;
}

.v-chip.v-size--x-small {
  padding: 0 8px !important;
}
</style>
