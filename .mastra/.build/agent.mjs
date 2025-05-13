import { D as DiagAPI, C as ContextAPI, a as createContextKey, r as registerGlobal, u as unregisterGlobal, g as getGlobal, t as trace, S as SpanStatusCode, M as MastraBase, b as generateText, o as output_exports, d as generateObject, s as streamText, e as streamObject, R as RegisteredLogger, j as jsonSchema, f as delay, h as ensureToolProperties, i as ensureAllMessagesAreCoreMessages, k as createMastraProxy, m as makeCoreTool } from './tools.mjs';
import { l as lib } from './_virtual__virtual-zod.mjs';
import { RuntimeContext } from './@mastra-core-runtime-context.mjs';
import { e as executeHook } from './hooks.mjs';
import { randomUUID } from 'crypto';

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __read = (undefined && undefined.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (undefined && undefined.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var BaggageImpl = /** @class */ (function () {
    function BaggageImpl(entries) {
        this._entries = entries ? new Map(entries) : new Map();
    }
    BaggageImpl.prototype.getEntry = function (key) {
        var entry = this._entries.get(key);
        if (!entry) {
            return undefined;
        }
        return Object.assign({}, entry);
    };
    BaggageImpl.prototype.getAllEntries = function () {
        return Array.from(this._entries.entries()).map(function (_a) {
            var _b = __read(_a, 2), k = _b[0], v = _b[1];
            return [k, v];
        });
    };
    BaggageImpl.prototype.setEntry = function (key, entry) {
        var newBaggage = new BaggageImpl(this._entries);
        newBaggage._entries.set(key, entry);
        return newBaggage;
    };
    BaggageImpl.prototype.removeEntry = function (key) {
        var newBaggage = new BaggageImpl(this._entries);
        newBaggage._entries.delete(key);
        return newBaggage;
    };
    BaggageImpl.prototype.removeEntries = function () {
        var e_1, _a;
        var keys = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            keys[_i] = arguments[_i];
        }
        var newBaggage = new BaggageImpl(this._entries);
        try {
            for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                var key = keys_1_1.value;
                newBaggage._entries.delete(key);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return newBaggage;
    };
    BaggageImpl.prototype.clear = function () {
        return new BaggageImpl();
    };
    return BaggageImpl;
}());

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
DiagAPI.instance();
/**
 * Create a new Baggage with optional entries
 *
 * @param entries An array of baggage entries the new baggage should contain
 */
function createBaggage(entries) {
    if (entries === void 0) { entries = {}; }
    return new BaggageImpl(new Map(Object.entries(entries)));
}

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var defaultTextMapGetter = {
    get: function (carrier, key) {
        if (carrier == null) {
            return undefined;
        }
        return carrier[key];
    },
    keys: function (carrier) {
        if (carrier == null) {
            return [];
        }
        return Object.keys(carrier);
    },
};
var defaultTextMapSetter = {
    set: function (carrier, key, value) {
        if (carrier == null) {
            return;
        }
        carrier[key] = value;
    },
};

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var SpanKind;
(function (SpanKind) {
    /** Default value. Indicates that the span is used internally. */
    SpanKind[SpanKind["INTERNAL"] = 0] = "INTERNAL";
    /**
     * Indicates that the span covers server-side handling of an RPC or other
     * remote request.
     */
    SpanKind[SpanKind["SERVER"] = 1] = "SERVER";
    /**
     * Indicates that the span covers the client-side wrapper around an RPC or
     * other remote request.
     */
    SpanKind[SpanKind["CLIENT"] = 2] = "CLIENT";
    /**
     * Indicates that the span describes producer sending a message to a
     * broker. Unlike client and server, there is no direct critical path latency
     * relationship between producer and consumer spans.
     */
    SpanKind[SpanKind["PRODUCER"] = 3] = "PRODUCER";
    /**
     * Indicates that the span describes consumer receiving a message from a
     * broker. Unlike client and server, there is no direct critical path latency
     * relationship between producer and consumer spans.
     */
    SpanKind[SpanKind["CONSUMER"] = 4] = "CONSUMER";
})(SpanKind || (SpanKind = {}));

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Split module-level variable definition into separate files to allow
// tree-shaking on each api instance.
/** Entrypoint for context API */
var context = ContextAPI.getInstance();

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * No-op implementations of {@link TextMapPropagator}.
 */
var NoopTextMapPropagator = /** @class */ (function () {
    function NoopTextMapPropagator() {
    }
    /** Noop inject function does nothing */
    NoopTextMapPropagator.prototype.inject = function (_context, _carrier) { };
    /** Noop extract function does nothing and returns the input context */
    NoopTextMapPropagator.prototype.extract = function (context, _carrier) {
        return context;
    };
    NoopTextMapPropagator.prototype.fields = function () {
        return [];
    };
    return NoopTextMapPropagator;
}());

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Baggage key
 */
var BAGGAGE_KEY = createContextKey('OpenTelemetry Baggage Key');
/**
 * Retrieve the current baggage from the given context
 *
 * @param {Context} Context that manage all context values
 * @returns {Baggage} Extracted baggage from the context
 */
function getBaggage(context) {
    return context.getValue(BAGGAGE_KEY) || undefined;
}
/**
 * Retrieve the current baggage from the active/current context
 *
 * @returns {Baggage} Extracted baggage from the context
 */
function getActiveBaggage() {
    return getBaggage(ContextAPI.getInstance().active());
}
/**
 * Store a baggage in the given context
 *
 * @param {Context} Context that manage all context values
 * @param {Baggage} baggage that will be set in the actual context
 */
function setBaggage(context, baggage) {
    return context.setValue(BAGGAGE_KEY, baggage);
}
/**
 * Delete the baggage stored in the given context
 *
 * @param {Context} Context that manage all context values
 */
function deleteBaggage(context) {
    return context.deleteValue(BAGGAGE_KEY);
}

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var API_NAME = 'propagation';
var NOOP_TEXT_MAP_PROPAGATOR = new NoopTextMapPropagator();
/**
 * Singleton object which represents the entry point to the OpenTelemetry Propagation API
 */
var PropagationAPI = /** @class */ (function () {
    /** Empty private constructor prevents end users from constructing a new instance of the API */
    function PropagationAPI() {
        this.createBaggage = createBaggage;
        this.getBaggage = getBaggage;
        this.getActiveBaggage = getActiveBaggage;
        this.setBaggage = setBaggage;
        this.deleteBaggage = deleteBaggage;
    }
    /** Get the singleton instance of the Propagator API */
    PropagationAPI.getInstance = function () {
        if (!this._instance) {
            this._instance = new PropagationAPI();
        }
        return this._instance;
    };
    /**
     * Set the current propagator.
     *
     * @returns true if the propagator was successfully registered, else false
     */
    PropagationAPI.prototype.setGlobalPropagator = function (propagator) {
        return registerGlobal(API_NAME, propagator, DiagAPI.instance());
    };
    /**
     * Inject context into a carrier to be propagated inter-process
     *
     * @param context Context carrying tracing data to inject
     * @param carrier carrier to inject context into
     * @param setter Function used to set values on the carrier
     */
    PropagationAPI.prototype.inject = function (context, carrier, setter) {
        if (setter === void 0) { setter = defaultTextMapSetter; }
        return this._getGlobalPropagator().inject(context, carrier, setter);
    };
    /**
     * Extract context from a carrier
     *
     * @param context Context which the newly created context will inherit from
     * @param carrier Carrier to extract context from
     * @param getter Function used to extract keys from a carrier
     */
    PropagationAPI.prototype.extract = function (context, carrier, getter) {
        if (getter === void 0) { getter = defaultTextMapGetter; }
        return this._getGlobalPropagator().extract(context, carrier, getter);
    };
    /**
     * Return a list of all fields which may be used by the propagator.
     */
    PropagationAPI.prototype.fields = function () {
        return this._getGlobalPropagator().fields();
    };
    /** Remove the global propagator */
    PropagationAPI.prototype.disable = function () {
        unregisterGlobal(API_NAME, DiagAPI.instance());
    };
    PropagationAPI.prototype._getGlobalPropagator = function () {
        return getGlobal(API_NAME) || NOOP_TEXT_MAP_PROPAGATOR;
    };
    return PropagationAPI;
}());

/*
 * Copyright The OpenTelemetry Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Split module-level variable definition into separate files to allow
// tree-shaking on each api instance.
/** Entrypoint for propagation API */
var propagation = PropagationAPI.getInstance();

function hasActiveTelemetry(tracerName = "default-tracer") {
  try {
    return !!trace.getTracer(tracerName);
  } catch {
    return false;
  }
}
function getBaggageValues(ctx) {
  const currentBaggage = propagation.getBaggage(ctx);
  const requestId = currentBaggage?.getEntry("http.request_id")?.value;
  const componentName = currentBaggage?.getEntry("componentName")?.value;
  const runId = currentBaggage?.getEntry("runId")?.value;
  return {
    requestId,
    componentName,
    runId
  };
}

// src/telemetry/telemetry.decorators.ts
function withSpan(options) {
  return function(_target, propertyKey, descriptor) {
    if (!descriptor || typeof descriptor === "number") return;
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);
    descriptor.value = function(...args) {
      if (options?.skipIfNoTelemetry && !hasActiveTelemetry(options?.tracerName)) {
        return originalMethod.apply(this, args);
      }
      const tracer = trace.getTracer(options?.tracerName ?? "default-tracer");
      let spanName;
      let spanKind;
      if (typeof options === "string") {
        spanName = options;
      } else if (options) {
        spanName = options.spanName || methodName;
        spanKind = options.spanKind;
      } else {
        spanName = methodName;
      }
      const span = tracer.startSpan(spanName, { kind: spanKind });
      let ctx = trace.setSpan(context.active(), span);
      args.forEach((arg, index) => {
        try {
          span.setAttribute(`${spanName}.argument.${index}`, JSON.stringify(arg));
        } catch {
          span.setAttribute(`${spanName}.argument.${index}`, "[Not Serializable]");
        }
      });
      const { requestId, componentName, runId } = getBaggageValues(ctx);
      if (requestId) {
        span.setAttribute("http.request_id", requestId);
      }
      if (componentName) {
        span.setAttribute("componentName", componentName);
        span.setAttribute("runId", runId);
      } else if (this && this.name) {
        span.setAttribute("componentName", this.name);
        span.setAttribute("runId", this.runId);
        ctx = propagation.setBaggage(
          ctx,
          propagation.createBaggage({
            // @ts-ignore
            componentName: { value: this.name },
            // @ts-ignore
            runId: { value: this.runId },
            // @ts-ignore
            "http.request_id": { value: requestId }
          })
        );
      }
      let result;
      try {
        result = context.with(ctx, () => originalMethod.apply(this, args));
        if (result instanceof Promise) {
          return result.then((resolvedValue) => {
            try {
              span.setAttribute(`${spanName}.result`, JSON.stringify(resolvedValue));
            } catch {
              span.setAttribute(`${spanName}.result`, "[Not Serializable]");
            }
            return resolvedValue;
          }).finally(() => span.end());
        }
        try {
          span.setAttribute(`${spanName}.result`, JSON.stringify(result));
        } catch {
          span.setAttribute(`${spanName}.result`, "[Not Serializable]");
        }
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Unknown error"
        });
        if (error instanceof Error) {
          span.recordException(error);
        }
        throw error;
      } finally {
        if (!(result instanceof Promise)) {
          span.end();
        }
      }
    };
    return descriptor;
  };
}
function InstrumentClass(options) {
  return function(target) {
    const methods = Object.getOwnPropertyNames(target.prototype);
    methods.forEach((method) => {
      if (options?.excludeMethods?.includes(method) || method === "constructor") return;
      if (options?.methodFilter && !options.methodFilter(method)) return;
      const descriptor = Object.getOwnPropertyDescriptor(target.prototype, method);
      if (descriptor && typeof descriptor.value === "function") {
        Object.defineProperty(
          target.prototype,
          method,
          withSpan({
            spanName: options?.prefix ? `${options.prefix}.${method}` : method,
            skipIfNoTelemetry: true,
            spanKind: options?.spanKind || SpanKind.INTERNAL,
            tracerName: options?.tracerName
          })(target, method, descriptor)
        );
      }
    });
    return target;
  };
}
var Telemetry = class _Telemetry {
  tracer = trace.getTracer("default");
  name = "default-service";
  constructor(config) {
    this.name = config.serviceName ?? "default-service";
    this.tracer = trace.getTracer(this.name);
  }
  /**
   * @deprecated This method does not do anything
   */
  async shutdown() {
  }
  /**
   * Initialize telemetry with the given configuration
   * @param config - Optional telemetry configuration object
   * @returns Telemetry instance that can be used for tracing
   */
  static init(config = {}) {
    try {
      if (!global.__TELEMETRY__) {
        global.__TELEMETRY__ = new _Telemetry(config);
      }
      return global.__TELEMETRY__;
    } catch (error) {
      console.error("Failed to initialize telemetry:", error);
      throw error;
    }
  }
  static getActiveSpan() {
    const span = trace.getActiveSpan();
    return span;
  }
  /**
   * Get the global telemetry instance
   * @throws {Error} If telemetry has not been initialized
   * @returns {Telemetry} The global telemetry instance
   */
  static get() {
    if (!global.__TELEMETRY__) {
      throw new Error("Telemetry not initialized");
    }
    return global.__TELEMETRY__;
  }
  /**
   * Wraps a class instance with telemetry tracing
   * @param instance The class instance to wrap
   * @param options Optional configuration for tracing
   * @returns Wrapped instance with all methods traced
   */
  traceClass(instance, options = {}) {
    const { skipIfNoTelemetry = true } = options;
    if (skipIfNoTelemetry && !hasActiveTelemetry()) {
      return instance;
    }
    const { spanNamePrefix = instance.constructor.name.toLowerCase(), attributes = {}, excludeMethods = [] } = options;
    return new Proxy(instance, {
      get: (target, prop) => {
        const value = target[prop];
        if (typeof value === "function" && prop !== "constructor" && !prop.toString().startsWith("_") && !excludeMethods.includes(prop.toString())) {
          return this.traceMethod(value.bind(target), {
            spanName: `${spanNamePrefix}.${prop.toString()}`,
            attributes: {
              ...attributes,
              [`${spanNamePrefix}.name`]: target.constructor.name,
              [`${spanNamePrefix}.method.name`]: prop.toString()
            }
          });
        }
        return value;
      }
    });
  }
  static setBaggage(baggage, ctx = context.active()) {
    const currentBaggage = Object.fromEntries(propagation.getBaggage(ctx)?.getAllEntries() ?? []);
    const newCtx = propagation.setBaggage(
      ctx,
      propagation.createBaggage({
        ...currentBaggage,
        ...baggage
      })
    );
    return newCtx;
  }
  static withContext(ctx, fn) {
    return context.with(ctx, fn);
  }
  /**
   * method to trace individual methods with proper context
   * @param method The method to trace
   * @param context Additional context for the trace
   * @returns Wrapped method with tracing
   */
  traceMethod(method, context3) {
    let ctx = context.active();
    const { skipIfNoTelemetry = true } = context3;
    if (skipIfNoTelemetry && !hasActiveTelemetry()) {
      return method;
    }
    return (...args) => {
      const span = this.tracer.startSpan(context3.spanName);
      function handleError(error) {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message
        });
        span.end();
        throw error;
      }
      try {
        let recordResult2 = function(res) {
          try {
            span.setAttribute(`${context3.spanName}.result`, JSON.stringify(res));
          } catch {
            span.setAttribute(`${context3.spanName}.result`, "[Not Serializable]");
          }
          span.end();
          return res;
        };
        const { requestId, componentName, runId } = getBaggageValues(ctx);
        if (context3.attributes) {
          span.setAttributes(context3.attributes);
        }
        if (requestId) {
          span.setAttribute("http.request_id", requestId);
        }
        if (context3.attributes?.componentName) {
          ctx = propagation.setBaggage(
            ctx,
            propagation.createBaggage({
              componentName: { value: context3.attributes.componentName },
              // @ts-ignore
              runId: { value: context3.attributes.runId },
              // @ts-ignore
              "http.request_id": { value: requestId }
            })
          );
        } else {
          if (componentName) {
            span.setAttribute("componentName", componentName);
            span.setAttribute("runId", runId);
          } else if (this && this.name) {
            span.setAttribute("componentName", this.name);
            span.setAttribute("runId", this.runId);
            ctx = propagation.setBaggage(
              ctx,
              propagation.createBaggage({
                componentName: { value: this.name },
                // @ts-ignore
                runId: { value: this.runId },
                // @ts-ignore
                "http.request_id": { value: requestId }
              })
            );
          }
        }
        args.forEach((arg, index) => {
          try {
            span.setAttribute(`${context3.spanName}.argument.${index}`, JSON.stringify(arg));
          } catch {
            span.setAttribute(`${context3.spanName}.argument.${index}`, "[Not Serializable]");
          }
        });
        let result;
        context.with(trace.setSpan(ctx, span), () => {
          result = method(...args);
        });
        if (result instanceof Promise) {
          return result.then(recordResult2).catch(handleError);
        } else {
          return recordResult2(result);
        }
      } catch (error) {
        handleError(error);
      }
    };
  }
  getBaggageTracer() {
    return new BaggageTracer(this.tracer);
  }
};
var BaggageTracer = class {
  _tracer;
  constructor(tracer) {
    this._tracer = tracer;
  }
  startSpan(name, options = {}, ctx) {
    ctx = ctx ?? context.active();
    const span = this._tracer.startSpan(name, options, ctx);
    const { componentName, runId, requestId } = getBaggageValues(ctx);
    span.setAttribute("componentName", componentName);
    span.setAttribute("runId", runId);
    span.setAttribute("http.request_id", requestId);
    return span;
  }
  startActiveSpan(name, optionsOrFn, ctxOrFn, fn) {
    if (typeof optionsOrFn === "function") {
      const wrappedFn2 = (span) => {
        const { componentName, runId, requestId } = getBaggageValues(context.active());
        span.setAttribute("componentName", componentName);
        span.setAttribute("runId", runId);
        span.setAttribute("http.request_id", requestId);
        return optionsOrFn(span);
      };
      return this._tracer.startActiveSpan(name, {}, context.active(), wrappedFn2);
    }
    if (typeof ctxOrFn === "function") {
      const wrappedFn2 = (span) => {
        const { componentName, runId, requestId } = getBaggageValues(context.active());
        span.setAttribute("componentName", componentName);
        span.setAttribute("runId", runId);
        span.setAttribute("http.request_id", requestId);
        return ctxOrFn(span);
      };
      return this._tracer.startActiveSpan(name, optionsOrFn, context.active(), wrappedFn2);
    }
    const wrappedFn = (span) => {
      const { componentName, runId, requestId } = getBaggageValues(ctxOrFn ?? context.active());
      span.setAttribute("componentName", componentName);
      span.setAttribute("runId", runId);
      span.setAttribute("http.request_id", requestId);
      return fn(span);
    };
    return this._tracer.startActiveSpan(name, optionsOrFn, ctxOrFn, wrappedFn);
  }
};

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
var __typeError = msg => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
  enumerable: true,
  configurable: true,
  writable: true,
  value
}) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", {
  value,
  configurable: true
});
var __decoratorStart = base => [,,, __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = fn => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name, done, metadata, fns) => ({
  kind: __decoratorStrings[kind],
  name,
  metadata,
  addInitializer: fn => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null))
});
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) fns[i].call(self) ;
  return value;
};
var __decorateElement = (array, flags, name, decorators, target, extra) => {
  var it,
    done,
    ctx,
    k = flags & 7,
    p = false;
  var j = 0;
  var extraInitializers = array[j] || (array[j] = []);
  var desc = k && ((target = target.prototype), k < 5 && (k > 3 || true) && __getOwnPropDesc(target , name));
  __name(target, name);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name, done = {}, array[3], extraInitializers);
    it = (0, decorators[i])(target, ctx), done._ = 1;
    __expectFn(it) && (target = it);
  }
  return __decoratorMetadata(array, target), desc && __defProp(target, name, desc), p ? k ^ 4 ? extra : desc : target;
};

// src/voice/voice.ts
var _MastraVoice_decorators, _init$1, _a$1;
_MastraVoice_decorators = [InstrumentClass({
  prefix: "voice",
  excludeMethods: ["__setTools", "__setLogger", "__setTelemetry", "#log"]
})];
var MastraVoice = class extends (_a$1 = MastraBase) {
  listeningModel;
  speechModel;
  speaker;
  realtimeConfig;
  constructor({
    listeningModel,
    speechModel,
    speaker,
    realtimeConfig,
    name
  } = {}) {
    super({
      component: "VOICE",
      name
    });
    this.listeningModel = listeningModel;
    this.speechModel = speechModel;
    this.speaker = speaker;
    this.realtimeConfig = realtimeConfig;
  }
  traced(method, methodName) {
    return this.telemetry?.traceMethod(method, {
      spanName: `voice.${methodName}`,
      attributes: {
        "voice.type": this.speechModel?.name || this.listeningModel?.name || "unknown"
      }
    }) ?? method;
  }
  updateConfig(_options) {
    this.logger.warn("updateConfig not implemented by this voice provider");
  }
  /**
   * Initializes a WebSocket or WebRTC connection for real-time communication
   * @returns Promise that resolves when the connection is established
   */
  connect(_options) {
    this.logger.warn("connect not implemented by this voice provider");
    return Promise.resolve();
  }
  /**
   * Relay audio data to the voice provider for real-time processing
   * @param audioData Audio data to relay
   */
  send(_audioData) {
    this.logger.warn("relay not implemented by this voice provider");
    return Promise.resolve();
  }
  /**
   * Trigger voice providers to respond
   */
  answer(_options) {
    this.logger.warn("answer not implemented by this voice provider");
    return Promise.resolve();
  }
  /**
   * Equip the voice provider with instructions
   * @param instructions Instructions to add
   */
  addInstructions(_instructions) {}
  /**
   * Equip the voice provider with tools
   * @param tools Array of tools to add
   */
  addTools(_tools) {}
  /**
   * Disconnect from the WebSocket or WebRTC connection
   */
  close() {
    this.logger.warn("close not implemented by this voice provider");
  }
  /**
   * Register an event listener
   * @param event Event name (e.g., 'speaking', 'writing', 'error')
   * @param callback Callback function that receives event data
   */
  on(_event, _callback) {
    this.logger.warn("on not implemented by this voice provider");
  }
  /**
   * Remove an event listener
   * @param event Event name (e.g., 'speaking', 'writing', 'error')
   * @param callback Callback function to remove
   */
  off(_event, _callback) {
    this.logger.warn("off not implemented by this voice provider");
  }
  /**
   * Get available speakers/voices
   * @returns Array of available voice IDs and their metadata
   */
  getSpeakers() {
    this.logger.warn("getSpeakers not implemented by this voice provider");
    return Promise.resolve([]);
  }
};
MastraVoice = /*@__PURE__*/(_ => {
  _init$1 = __decoratorStart(_a$1);
  MastraVoice = __decorateElement(_init$1, 0, "MastraVoice", _MastraVoice_decorators, MastraVoice);
  __runInitializers(_init$1, 1, MastraVoice);

  // src/voice/composite-voice.ts
  return MastraVoice;
})();

// src/voice/default-voice.ts
var DefaultVoice = class extends MastraVoice {
  constructor() {
    super();
  }
  async speak(_input) {
    throw new Error("No voice provider configured");
  }
  async listen(_input) {
    throw new Error("No voice provider configured");
  }
  async getSpeakers() {
    throw new Error("No voice provider configured");
  }
};

// src/llm/model/base.ts
var MastraLLMBase = class extends MastraBase {
  // @ts-ignore
  #mastra;
  #model;
  constructor({ name, model }) {
    super({
      component: RegisteredLogger.LLM,
      name
    });
    this.#model = model;
  }
  getProvider() {
    return this.#model.provider;
  }
  getModelId() {
    return this.#model.modelId;
  }
  getModel() {
    return this.#model;
  }
  convertToMessages(messages) {
    if (Array.isArray(messages)) {
      return messages.map((m) => {
        if (typeof m === "string") {
          return {
            role: "user",
            content: m
          };
        }
        return m;
      });
    }
    return [
      {
        role: "user",
        content: messages
      }
    ];
  }
  __registerPrimitives(p) {
    if (p.telemetry) {
      this.__setTelemetry(p.telemetry);
    }
    if (p.logger) {
      this.__setLogger(p.logger);
    }
  }
  __registerMastra(p) {
    this.#mastra = p;
  }
  async __text(input) {
    this.logger.debug(`[LLMs:${this.name}] Generating text.`, { input });
    throw new Error("Method not implemented.");
  }
  async __textObject(input) {
    this.logger.debug(`[LLMs:${this.name}] Generating object.`, { input });
    throw new Error("Method not implemented.");
  }
  async generate(messages, options) {
    this.logger.debug(`[LLMs:${this.name}] Generating text.`, { messages, options });
    throw new Error("Method not implemented.");
  }
  async __stream(input) {
    this.logger.debug(`[LLMs:${this.name}] Streaming text.`, { input });
    throw new Error("Method not implemented.");
  }
  async __streamObject(input) {
    this.logger.debug(`[LLMs:${this.name}] Streaming object.`, { input });
    throw new Error("Method not implemented.");
  }
  async stream(messages, options) {
    this.logger.debug(`[LLMs:${this.name}] Streaming text.`, { messages, options });
    throw new Error("Method not implemented.");
  }
};

// src/llm/model/model.ts
var MastraLLM = class extends MastraLLMBase {
  #model;
  #mastra;
  constructor({ model, mastra }) {
    super({ name: "aisdk", model });
    this.#model = model;
    if (mastra) {
      this.#mastra = mastra;
      if (mastra.getLogger()) {
        this.__setLogger(mastra.getLogger());
      }
    }
  }
  __registerPrimitives(p) {
    if (p.telemetry) {
      this.__setTelemetry(p.telemetry);
    }
    if (p.logger) {
      this.__setLogger(p.logger);
    }
  }
  __registerMastra(p) {
    this.#mastra = p;
  }
  getProvider() {
    return this.#model.provider;
  }
  getModelId() {
    return this.#model.modelId;
  }
  getModel() {
    return this.#model;
  }
  async __text({
    runId,
    messages,
    maxSteps = 5,
    tools = {},
    temperature,
    toolChoice = "auto",
    onStepFinish,
    experimental_output,
    telemetry,
    threadId,
    resourceId,
    memory,
    runtimeContext,
    ...rest
  }) {
    const model = this.#model;
    this.logger.debug(`[LLM] - Generating text`, {
      runId,
      messages,
      maxSteps,
      threadId,
      resourceId,
      tools: Object.keys(tools)
    });
    const argsForExecute = {
      model,
      temperature,
      tools: {
        ...tools
      },
      toolChoice,
      maxSteps,
      onStepFinish: async (props) => {
        void onStepFinish?.(props);
        this.logger.debug("[LLM] - Step Change:", {
          text: props?.text,
          toolCalls: props?.toolCalls,
          toolResults: props?.toolResults,
          finishReason: props?.finishReason,
          usage: props?.usage,
          runId
        });
        if (props?.response?.headers?.["x-ratelimit-remaining-tokens"] && parseInt(props?.response?.headers?.["x-ratelimit-remaining-tokens"], 10) < 2e3) {
          this.logger.warn("Rate limit approaching, waiting 10 seconds", { runId });
          await delay(10 * 1e3);
        }
      },
      ...rest
    };
    let schema;
    if (experimental_output) {
      this.logger.debug("[LLM] - Using experimental output", {
        runId
      });
      if (typeof experimental_output.parse === "function") {
        schema = experimental_output;
        if (schema instanceof lib.z.ZodArray) {
          schema = schema._def.type;
        }
      } else {
        schema = jsonSchema(experimental_output);
      }
    }
    return await generateText({
      messages,
      ...argsForExecute,
      experimental_telemetry: {
        ...this.experimental_telemetry,
        ...telemetry
      },
      experimental_output: schema ? output_exports.object({
        schema
      }) : void 0
    });
  }
  async __textObject({
    messages,
    onStepFinish,
    maxSteps = 5,
    tools = {},
    structuredOutput,
    runId,
    temperature,
    toolChoice = "auto",
    telemetry,
    threadId,
    resourceId,
    memory,
    runtimeContext,
    ...rest
  }) {
    const model = this.#model;
    this.logger.debug(`[LLM] - Generating a text object`, { runId });
    const argsForExecute = {
      model,
      temperature,
      tools: {
        ...tools
      },
      maxSteps,
      toolChoice,
      onStepFinish: async (props) => {
        void onStepFinish?.(props);
        this.logger.debug("[LLM] - Step Change:", {
          text: props?.text,
          toolCalls: props?.toolCalls,
          toolResults: props?.toolResults,
          finishReason: props?.finishReason,
          usage: props?.usage,
          runId
        });
        if (props?.response?.headers?.["x-ratelimit-remaining-tokens"] && parseInt(props?.response?.headers?.["x-ratelimit-remaining-tokens"], 10) < 2e3) {
          this.logger.warn("Rate limit approaching, waiting 10 seconds", { runId });
          await delay(10 * 1e3);
        }
      },
      ...rest
    };
    let schema;
    let output = "object";
    if (typeof structuredOutput.parse === "function") {
      schema = structuredOutput;
      if (schema instanceof lib.z.ZodArray) {
        output = "array";
        schema = schema._def.type;
      }
    } else {
      schema = jsonSchema(structuredOutput);
    }
    return await generateObject({
      messages,
      ...argsForExecute,
      output,
      schema,
      experimental_telemetry: {
        ...this.experimental_telemetry,
        ...telemetry
      }
    });
  }
  async __stream({
    messages,
    onStepFinish,
    onFinish,
    maxSteps = 5,
    tools = {},
    runId,
    temperature,
    toolChoice = "auto",
    experimental_output,
    telemetry,
    threadId,
    resourceId,
    memory,
    runtimeContext,
    ...rest
  }) {
    const model = this.#model;
    this.logger.debug(`[LLM] - Streaming text`, {
      runId,
      threadId,
      resourceId,
      messages,
      maxSteps,
      tools: Object.keys(tools || {})
    });
    const argsForExecute = {
      model,
      temperature,
      tools: {
        ...tools
      },
      maxSteps,
      toolChoice,
      onStepFinish: async (props) => {
        void onStepFinish?.(props);
        this.logger.debug("[LLM] - Stream Step Change:", {
          text: props?.text,
          toolCalls: props?.toolCalls,
          toolResults: props?.toolResults,
          finishReason: props?.finishReason,
          usage: props?.usage,
          runId
        });
        if (props?.response?.headers?.["x-ratelimit-remaining-tokens"] && parseInt(props?.response?.headers?.["x-ratelimit-remaining-tokens"], 10) < 2e3) {
          this.logger.warn("Rate limit approaching, waiting 10 seconds", { runId });
          await delay(10 * 1e3);
        }
      },
      onFinish: async (props) => {
        void onFinish?.(props);
        this.logger.debug("[LLM] - Stream Finished:", {
          text: props?.text,
          toolCalls: props?.toolCalls,
          toolResults: props?.toolResults,
          finishReason: props?.finishReason,
          usage: props?.usage,
          runId,
          threadId,
          resourceId
        });
      },
      ...rest
    };
    let schema;
    if (experimental_output) {
      this.logger.debug("[LLM] - Using experimental output", {
        runId
      });
      if (typeof experimental_output.parse === "function") {
        schema = experimental_output;
        if (schema instanceof lib.z.ZodArray) {
          schema = schema._def.type;
        }
      } else {
        schema = jsonSchema(experimental_output);
      }
    }
    return await streamText({
      messages,
      ...argsForExecute,
      experimental_telemetry: {
        ...this.experimental_telemetry,
        ...telemetry
      },
      experimental_output: schema ? output_exports.object({
        schema
      }) : void 0
    });
  }
  async __streamObject({
    messages,
    runId,
    tools = {},
    maxSteps = 5,
    toolChoice = "auto",
    runtimeContext,
    threadId,
    resourceId,
    memory,
    temperature,
    onStepFinish,
    onFinish,
    structuredOutput,
    telemetry,
    ...rest
  }) {
    const model = this.#model;
    this.logger.debug(`[LLM] - Streaming structured output`, {
      runId,
      messages,
      maxSteps,
      tools: Object.keys(tools || {})
    });
    const finalTools = tools;
    const argsForExecute = {
      model,
      temperature,
      tools: {
        ...finalTools
      },
      maxSteps,
      toolChoice,
      onStepFinish: async (props) => {
        void onStepFinish?.(props);
        this.logger.debug("[LLM] - Stream Step Change:", {
          text: props?.text,
          toolCalls: props?.toolCalls,
          toolResults: props?.toolResults,
          finishReason: props?.finishReason,
          usage: props?.usage,
          runId,
          threadId,
          resourceId
        });
        if (props?.response?.headers?.["x-ratelimit-remaining-tokens"] && parseInt(props?.response?.headers?.["x-ratelimit-remaining-tokens"], 10) < 2e3) {
          this.logger.warn("Rate limit approaching, waiting 10 seconds", { runId });
          await delay(10 * 1e3);
        }
      },
      onFinish: async (props) => {
        void onFinish?.(props);
        this.logger.debug("[LLM] - Stream Finished:", {
          text: props?.text,
          toolCalls: props?.toolCalls,
          toolResults: props?.toolResults,
          finishReason: props?.finishReason,
          usage: props?.usage,
          runId,
          threadId,
          resourceId
        });
      },
      ...rest
    };
    let schema;
    let output = "object";
    if (typeof structuredOutput.parse === "function") {
      schema = structuredOutput;
      if (schema instanceof lib.z.ZodArray) {
        output = "array";
        schema = schema._def.type;
      }
    } else {
      schema = jsonSchema(structuredOutput);
    }
    return streamObject({
      messages,
      ...argsForExecute,
      output,
      schema,
      experimental_telemetry: {
        ...this.experimental_telemetry,
        ...telemetry
      }
    });
  }
  async generate(messages, { maxSteps = 5, output, ...rest }) {
    const msgs = this.convertToMessages(messages);
    if (!output) {
      return await this.__text({
        messages: msgs,
        maxSteps,
        ...rest
      });
    }
    return await this.__textObject({
      messages: msgs,
      structuredOutput: output,
      maxSteps,
      ...rest
    });
  }
  async stream(messages, { maxSteps = 5, output, ...rest }) {
    const msgs = this.convertToMessages(messages);
    if (!output) {
      return await this.__stream({
        messages: msgs,
        maxSteps,
        ...rest
      });
    }
    return await this.__streamObject({
      messages: msgs,
      structuredOutput: output,
      maxSteps,
      ...rest
    });
  }
  convertToUIMessages(messages) {
    function addToolMessageToChat({
      toolMessage,
      messages: messages2,
      toolResultContents
    }) {
      const chatMessages2 = messages2.map((message) => {
        if (message.toolInvocations) {
          return {
            ...message,
            toolInvocations: message.toolInvocations.map((toolInvocation) => {
              const toolResult = toolMessage.content.find((tool) => tool.toolCallId === toolInvocation.toolCallId);
              if (toolResult) {
                return {
                  ...toolInvocation,
                  state: "result",
                  result: toolResult.result
                };
              }
              return toolInvocation;
            })
          };
        }
        return message;
      });
      const resultContents = [...toolResultContents, ...toolMessage.content];
      return { chatMessages: chatMessages2, toolResultContents: resultContents };
    }
    const { chatMessages } = messages.reduce(
      (obj, message) => {
        if (message.role === "tool") {
          return addToolMessageToChat({
            toolMessage: message,
            messages: obj.chatMessages,
            toolResultContents: obj.toolResultContents
          });
        }
        let textContent = "";
        let toolInvocations = [];
        if (typeof message.content === "string") {
          textContent = message.content;
        } else if (typeof message.content === "number") {
          textContent = String(message.content);
        } else if (Array.isArray(message.content)) {
          for (const content of message.content) {
            if (content.type === "text") {
              textContent += content.text;
            } else if (content.type === "tool-call") {
              const toolResult = obj.toolResultContents.find((tool) => tool.toolCallId === content.toolCallId);
              toolInvocations.push({
                state: toolResult ? "result" : "call",
                toolCallId: content.toolCallId,
                toolName: content.toolName,
                args: content.args,
                result: toolResult?.result
              });
            }
          }
        }
        obj.chatMessages.push({
          id: message.id,
          role: message.role,
          content: textContent,
          toolInvocations
        });
        return obj;
      },
      { chatMessages: [], toolResultContents: [] }
    );
    return chatMessages;
  }
};

// src/workflows/step.ts
var Step = class {
  id;
  description;
  inputSchema;
  outputSchema;
  payload;
  execute;
  retryConfig;
  mastra;
  constructor({
    id,
    description,
    execute,
    payload,
    outputSchema,
    inputSchema,
    retryConfig
  }) {
    this.id = id;
    this.description = description ?? "";
    this.inputSchema = inputSchema;
    this.payload = payload;
    this.outputSchema = outputSchema;
    this.execute = execute;
    this.retryConfig = retryConfig;
  }
};
function resoolveMaybePromise(value, cb) {
  if (value instanceof Promise) {
    return value.then(cb);
  }
  return cb(value);
}
var _Agent_decorators, _init, _a;
_Agent_decorators = [InstrumentClass({
  prefix: "agent",
  excludeMethods: ["hasOwnMemory", "getMemory", "__primitive", "__registerMastra", "__registerPrimitives", "__setTools", "__setLogger", "__setTelemetry", "log", "getModel", "getInstructions", "getTools", "getLLM"]
})];
var Agent = class extends (_a = MastraBase) {
  id;
  name;
  #instructions;
  model;
  #mastra;
  #memory;
  #defaultGenerateOptions;
  #defaultStreamOptions;
  #tools;
  /** @deprecated This property is deprecated. Use evals instead. */
  metrics;
  evals;
  #voice;
  constructor(config) {
    super({
      component: RegisteredLogger.AGENT
    });
    this.name = config.name;
    this.id = config.name;
    this.#instructions = config.instructions;
    if (!config.model) {
      throw new Error(`LanguageModel is required to create an Agent. Please provide the 'model'.`);
    }
    this.model = config.model;
    this.#defaultGenerateOptions = config.defaultGenerateOptions || {};
    this.#defaultStreamOptions = config.defaultStreamOptions || {};
    this.#tools = config.tools || {};
    this.metrics = {};
    this.evals = {};
    if (config.mastra) {
      this.__registerMastra(config.mastra);
      this.__registerPrimitives({
        telemetry: config.mastra.getTelemetry(),
        logger: config.mastra.getLogger()
      });
    }
    if (config.metrics) {
      this.logger.warn("The metrics property is deprecated. Please use evals instead to add evaluation metrics.");
      this.metrics = config.metrics;
      this.evals = config.metrics;
    }
    if (config.evals) {
      this.evals = config.evals;
    }
    if (config.memory) {
      this.#memory = config.memory;
    }
    if (config.voice) {
      this.#voice = config.voice;
      if (typeof config.tools !== "function") {
        this.#voice?.addTools(this.tools);
      }
      if (typeof config.instructions === "string") {
        this.#voice?.addInstructions(config.instructions);
      }
    } else {
      this.#voice = new DefaultVoice();
    }
  }
  hasOwnMemory() {
    return Boolean(this.#memory);
  }
  getMemory() {
    return this.#memory ?? this.#mastra?.memory;
  }
  get voice() {
    if (typeof this.#instructions === "function") {
      throw new Error("Voice is not compatible when instructions are a function. Please use getVoice() instead.");
    }
    return this.#voice;
  }
  async getVoice({
    runtimeContext
  } = {}) {
    if (this.#voice) {
      const voice = this.#voice;
      voice?.addTools(await this.getTools({
        runtimeContext
      }));
      voice?.addInstructions(await this.getInstructions({
        runtimeContext
      }));
      return voice;
    } else {
      return new DefaultVoice();
    }
  }
  get instructions() {
    this.logger.warn("The instructions property is deprecated. Please use getInstructions() instead.");
    if (typeof this.#instructions === "function") {
      throw new Error("Instructions are not compatible when instructions are a function. Please use getInstructions() instead.");
    }
    return this.#instructions;
  }
  getInstructions({
    runtimeContext = new RuntimeContext()
  } = {}) {
    if (typeof this.#instructions === "string") {
      return this.#instructions;
    }
    const result = this.#instructions({
      runtimeContext
    });
    return resoolveMaybePromise(result, instructions => {
      if (!instructions) {
        this.logger.error(`[Agent:${this.name}] - Function-based instructions returned empty value`);
        throw new Error("Instructions are required to use an Agent. The function-based instructions returned an empty value.");
      }
      return instructions;
    });
  }
  get tools() {
    this.logger.warn("The tools property is deprecated. Please use getTools() instead.");
    if (typeof this.#tools === "function") {
      throw new Error("Tools are not compatible when tools are a function. Please use getTools() instead.");
    }
    return ensureToolProperties(this.#tools);
  }
  getTools({
    runtimeContext = new RuntimeContext()
  } = {}) {
    if (typeof this.#tools !== "function") {
      return ensureToolProperties(this.#tools);
    }
    const result = this.#tools({
      runtimeContext
    });
    return resoolveMaybePromise(result, tools => {
      if (!tools) {
        this.logger.error(`[Agent:${this.name}] - Function-based tools returned empty value`);
        throw new Error("Tools are required when using a function to provide them. The function returned an empty value.");
      }
      return ensureToolProperties(tools);
    });
  }
  get llm() {
    this.logger.warn("The llm property is deprecated. Please use getLLM() instead.");
    if (typeof this.model === "function") {
      throw new Error("LLM is not compatible when model is a function. Please use getLLM() instead.");
    }
    return this.getLLM();
  }
  /**
   * Gets or creates an LLM instance based on the current model
   * @param options Options for getting the LLM
   * @returns A promise that resolves to the LLM instance
   */
  getLLM({
    runtimeContext = new RuntimeContext()
  } = {}) {
    const model = this.getModel({
      runtimeContext
    });
    return resoolveMaybePromise(model, model2 => {
      const llm = new MastraLLM({
        model: model2,
        mastra: this.#mastra
      });
      if (this.#primitives) {
        llm.__registerPrimitives(this.#primitives);
      }
      if (this.#mastra) {
        llm.__registerMastra(this.#mastra);
      }
      return llm;
    });
  }
  /**
   * Gets the model, resolving it if it's a function
   * @param options Options for getting the model
   * @returns A promise that resolves to the model
   */
  getModel({
    runtimeContext = new RuntimeContext()
  } = {}) {
    if (typeof this.model !== "function") {
      if (!this.model) {
        this.logger.error(`[Agent:${this.name}] - No model provided`);
        throw new Error("Model is required to use an Agent.");
      }
      return this.model;
    }
    const result = this.model({
      runtimeContext
    });
    return resoolveMaybePromise(result, model => {
      if (!model) {
        this.logger.error(`[Agent:${this.name}] - Function-based model returned empty value`);
        throw new Error("Model is required to use an Agent. The function-based model returned an empty value.");
      }
      return model;
    });
  }
  __updateInstructions(newInstructions) {
    this.#instructions = newInstructions;
    this.logger.debug(`[Agents:${this.name}] Instructions updated.`, {
      model: this.model,
      name: this.name
    });
  }
  #primitives;
  __registerPrimitives(p) {
    if (p.telemetry) {
      this.__setTelemetry(p.telemetry);
    }
    if (p.logger) {
      this.__setLogger(p.logger);
    }
    this.#primitives = p;
    this.logger.debug(`[Agents:${this.name}] initialized.`, {
      model: this.model,
      name: this.name
    });
  }
  __registerMastra(mastra) {
    this.#mastra = mastra;
  }
  /**
   * Set the concrete tools for the agent
   * @param tools
   */
  __setTools(tools) {
    this.#tools = tools;
    this.logger.debug(`[Agents:${this.name}] Tools set for agent ${this.name}`, {
      model: this.model,
      name: this.name
    });
  }
  async generateTitleFromUserMessage({
    message,
    runtimeContext = new RuntimeContext()
  }) {
    const llm = await this.getLLM({
      runtimeContext
    });
    const {
      text
    } = await llm.__text({
      runtimeContext,
      messages: [{
        role: "system",
        content: `

    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons
    - the entire text you return will be used as the title`
      }, {
        role: "user",
        content: JSON.stringify(message)
      }]
    });
    const cleanedText = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    return cleanedText;
  }
  getMostRecentUserMessage(messages) {
    const userMessages = messages.filter(message => message.role === "user");
    return userMessages.at(-1);
  }
  async genTitle(userMessage) {
    let title = `New Thread ${(/* @__PURE__ */new Date()).toISOString()}`;
    try {
      if (userMessage) {
        title = await this.generateTitleFromUserMessage({
          message: userMessage
        });
      }
    } catch (e) {
      console.error("Error generating title:", e);
    }
    return title;
  }
  async fetchMemory({
    threadId,
    thread: passedThread,
    memoryConfig,
    resourceId,
    userMessages,
    systemMessage,
    runId
  }) {
    const memory = this.getMemory();
    if (memory) {
      const thread = passedThread ?? (await memory.getThreadById({
        threadId
      }));
      if (!thread) {
        return {
          threadId: threadId || "",
          messages: userMessages
        };
      }
      const newMessages = ensureAllMessagesAreCoreMessages(userMessages);
      const now = Date.now();
      const messages = newMessages.map((u, index) => {
        return {
          id: this.getMemory()?.generateId(),
          createdAt: new Date(now + index),
          threadId,
          ...u,
          content: u.content,
          role: u.role,
          type: "text"
        };
      });
      const [memoryMessages, memorySystemMessage] = threadId && memory ? await Promise.all([memory.rememberMessages({
        threadId,
        resourceId,
        config: memoryConfig,
        systemMessage,
        vectorMessageSearch: messages.slice(-1).map(m => {
          if (typeof m === `string`) {
            return m;
          }
          return m?.content || ``;
        }).join(`
`)
      }).then(r => r.messages), memory.getSystemMessage({
        threadId,
        memoryConfig
      })]) : [[], null];
      this.logger.debug("Saved messages to memory", {
        threadId,
        runId
      });
      const processedMessages = memory.processMessages({
        messages: this.sanitizeResponseMessages(memoryMessages),
        newMessages,
        systemMessage: typeof systemMessage?.content === `string` ? systemMessage.content : void 0,
        memorySystemMessage: memorySystemMessage ?? ``
      });
      return {
        threadId: thread.id,
        messages: [memorySystemMessage ? {
          role: "system",
          content: memorySystemMessage
        } : null, ...processedMessages, ...newMessages].filter(message => Boolean(message))
      };
    }
    return {
      threadId: threadId || "",
      messages: userMessages
    };
  }
  getResponseMessages({
    messages,
    threadId,
    resourceId,
    now
  }) {
    if (!messages) return [];
    const messagesArray = Array.isArray(messages) ? messages : [messages];
    return this.sanitizeResponseMessages(messagesArray).map((message, index) => {
      const messageId = randomUUID();
      let toolCallIds;
      let toolCallArgs;
      let toolNames;
      let type = "text";
      if (message.role === "tool") {
        toolCallIds = message.content.map(content => content.toolCallId);
        type = "tool-result";
      }
      if (message.role === "assistant") {
        const assistantContent = message.content;
        const assistantToolCalls = assistantContent.map(content => {
          if (content.type === "tool-call") {
            return {
              toolCallId: content.toolCallId,
              toolArgs: content.args,
              toolName: content.toolName
            };
          }
          return void 0;
        })?.filter(Boolean);
        toolCallIds = assistantToolCalls?.map(toolCall => toolCall.toolCallId);
        toolCallArgs = assistantToolCalls?.map(toolCall => toolCall.toolArgs);
        toolNames = assistantToolCalls?.map(toolCall => toolCall.toolName);
        type = assistantContent?.[0]?.type;
      }
      return {
        id: messageId,
        threadId,
        resourceId,
        role: message.role,
        content: message.content,
        createdAt: new Date(now + index),
        // use Date.now() + index to make sure every message is atleast one millisecond apart
        toolCallIds: toolCallIds?.length ? toolCallIds : void 0,
        toolCallArgs: toolCallArgs?.length ? toolCallArgs : void 0,
        toolNames: toolNames?.length ? toolNames : void 0,
        type
      };
    });
  }
  sanitizeResponseMessages(messages) {
    let toolResultIds = [];
    let toolCallIds = [];
    for (const message of messages) {
      if (!Array.isArray(message.content)) continue;
      if (message.role === "tool") {
        for (const content of message.content) {
          if (content.type === "tool-result") {
            toolResultIds.push(content.toolCallId);
          }
        }
      } else if (message.role === "assistant" || message.role === "user") {
        for (const content of message.content) {
          if (typeof content !== `string`) {
            if (content.type === `tool-call`) {
              toolCallIds.push(content.toolCallId);
            }
          }
        }
      }
    }
    const messagesBySanitizedContent = messages.map(message => {
      if (message.role !== "assistant" && message.role !== `tool` && message.role !== `user`) return message;
      if (!Array.isArray(message.content)) {
        return message;
      }
      const sanitizedContent = message.content.filter(content => {
        if (content.type === `tool-call`) {
          return toolResultIds.includes(content.toolCallId);
        }
        if (content.type === `text`) {
          return content.text.trim() !== ``;
        }
        if (content.type === `tool-result`) {
          return toolCallIds.includes(content.toolCallId);
        }
        return true;
      });
      return {
        ...message,
        content: sanitizedContent
      };
    });
    return messagesBySanitizedContent.filter(message => {
      if (typeof message.content === `string`) {
        if (message.role === "assistant") {
          return true;
        }
        return message.content !== "";
      }
      if (Array.isArray(message.content)) {
        return message.content.length && message.content.every(c => {
          if (c.type === `text`) {
            return c.text && c.text !== "";
          }
          return true;
        });
      }
      return true;
    });
  }
  async convertTools({
    toolsets,
    clientTools,
    threadId,
    resourceId,
    runId,
    runtimeContext
  }) {
    this.logger.debug(`[Agents:${this.name}] - Assigning tools`, {
      runId,
      threadId,
      resourceId
    });
    const memory = this.getMemory();
    const memoryTools = memory?.getTools?.();
    let mastraProxy = void 0;
    const logger = this.logger;
    if (this.#mastra) {
      mastraProxy = createMastraProxy({
        mastra: this.#mastra,
        logger
      });
    }
    const tools = await this.getTools({
      runtimeContext
    });
    const convertedEntries = await Promise.all(Object.entries(tools || {}).map(async ([k, tool]) => {
      if (tool) {
        const options = {
          name: k,
          runId,
          threadId,
          resourceId,
          logger: this.logger,
          mastra: mastraProxy,
          memory,
          agentName: this.name,
          runtimeContext,
          model: typeof this.model === "function" ? await this.getModel({
            runtimeContext
          }) : this.model
        };
        return [k, makeCoreTool(tool, options)];
      }
      return void 0;
    }));
    const converted = Object.fromEntries(convertedEntries.filter(entry => Boolean(entry)));
    let convertedMemoryTools = {};
    if (memoryTools) {
      const memoryToolEntries = await Promise.all(Object.entries(memoryTools).map(async ([k, tool]) => {
        return [k, {
          description: tool.description,
          parameters: tool.parameters,
          execute: typeof tool?.execute === "function" ? async (args, options) => {
            try {
              this.logger.debug(`[Agent:${this.name}] - Executing memory tool ${k}`, {
                name: k,
                description: tool.description,
                args,
                runId,
                threadId,
                resourceId
              });
              return tool?.execute?.({
                context: args,
                mastra: mastraProxy,
                memory,
                runId,
                threadId,
                resourceId,
                logger: this.logger,
                agentName: this.name,
                runtimeContext
              }, options) ?? void 0;
            } catch (err) {
              this.logger.error(`[Agent:${this.name}] - Failed memory tool execution`, {
                error: err,
                runId,
                threadId,
                resourceId
              });
              throw err;
            }
          } : void 0
        }];
      }));
      convertedMemoryTools = Object.fromEntries(memoryToolEntries.filter(entry => Boolean(entry)));
    }
    const toolsFromToolsetsConverted = {
      ...converted,
      ...convertedMemoryTools
    };
    const toolsFromToolsets = Object.values(toolsets || {});
    if (toolsFromToolsets.length > 0) {
      this.logger.debug(`[Agent:${this.name}] - Adding tools from toolsets ${Object.keys(toolsets || {}).join(", ")}`, {
        runId
      });
      for (const toolset of toolsFromToolsets) {
        for (const [toolName, tool] of Object.entries(toolset)) {
          const toolObj = tool;
          const options = {
            name: toolName,
            runId,
            threadId,
            resourceId,
            logger: this.logger,
            mastra: mastraProxy,
            memory,
            agentName: this.name,
            runtimeContext,
            model: typeof this.model === "function" ? await this.getModel({
              runtimeContext
            }) : this.model
          };
          const convertedToCoreTool = makeCoreTool(toolObj, options, "toolset");
          toolsFromToolsetsConverted[toolName] = convertedToCoreTool;
        }
      }
    }
    const clientToolsForInput = Object.entries(clientTools || {});
    if (clientToolsForInput.length > 0) {
      this.logger.debug(`[Agent:${this.name}] - Adding client tools ${Object.keys(clientTools || {}).join(", ")}`, {
        runId
      });
      for (const [toolName, tool] of clientToolsForInput) {
        const {
          execute,
          ...rest
        } = tool;
        const options = {
          name: toolName,
          runId,
          threadId,
          resourceId,
          logger: this.logger,
          mastra: mastraProxy,
          memory,
          agentName: this.name,
          runtimeContext,
          model: typeof this.model === "function" ? await this.getModel({
            runtimeContext
          }) : this.model
        };
        const convertedToCoreTool = makeCoreTool(rest, options, "client-tool");
        toolsFromToolsetsConverted[toolName] = convertedToCoreTool;
      }
    }
    return toolsFromToolsetsConverted;
  }
  async preExecute({
    resourceId,
    runId,
    threadId,
    thread,
    memoryConfig,
    messages,
    systemMessage
  }) {
    let coreMessages = [];
    let threadIdToUse = threadId;
    this.logger.debug(`Saving user messages in memory for agent ${this.name}`, {
      runId
    });
    const saveMessageResponse = await this.fetchMemory({
      threadId,
      thread,
      resourceId,
      userMessages: messages,
      memoryConfig,
      systemMessage
    });
    coreMessages = saveMessageResponse.messages;
    threadIdToUse = saveMessageResponse.threadId;
    return {
      coreMessages,
      threadIdToUse
    };
  }
  __primitive({
    instructions,
    messages,
    context,
    threadId,
    memoryConfig,
    resourceId,
    runId,
    toolsets,
    clientTools,
    runtimeContext
  }) {
    return {
      before: async () => {
        if (process.env.NODE_ENV !== "test") {
          this.logger.debug(`[Agents:${this.name}] - Starting generation`, {
            runId
          });
        }
        const systemMessage = {
          role: "system",
          content: instructions || `${this.instructions}.`
        };
        let coreMessages = messages;
        let threadIdToUse = threadId;
        let thread;
        const memory = this.getMemory();
        if (threadId && memory && !resourceId) {
          throw new Error(`A resourceId must be provided when passing a threadId and using Memory. Saw threadId ${threadId} but resourceId is ${resourceId}`);
        }
        if (memory && resourceId) {
          this.logger.debug(`[Agent:${this.name}] - Memory persistence enabled: store=${this.getMemory()?.constructor.name}, resourceId=${resourceId}`, {
            runId,
            resourceId,
            threadId: threadIdToUse,
            memoryStore: this.getMemory()?.constructor.name
          });
          thread = threadIdToUse ? await memory.getThreadById({
            threadId: threadIdToUse
          }) : void 0;
          if (!thread) {
            thread = await memory.createThread({
              threadId: threadIdToUse,
              resourceId,
              memoryConfig
            });
          }
          threadIdToUse = thread.id;
          const preExecuteResult = await this.preExecute({
            resourceId,
            runId,
            threadId: threadIdToUse,
            thread,
            memoryConfig,
            messages,
            systemMessage
          });
          coreMessages = preExecuteResult.coreMessages;
          threadIdToUse = preExecuteResult.threadIdToUse;
        }
        let convertedTools;
        const reasons = [];
        if (toolsets && Object.keys(toolsets || {}).length > 0) {
          reasons.push(`toolsets present (${Object.keys(toolsets || {}).length} tools)`);
        }
        if (this.getMemory() && resourceId) {
          reasons.push("memory and resourceId available");
        }
        this.logger.debug(`[Agent:${this.name}] - Enhancing tools: ${reasons.join(", ")}`, {
          runId,
          toolsets: toolsets ? Object.keys(toolsets) : void 0,
          clientTools: clientTools ? Object.keys(clientTools) : void 0,
          hasMemory: !!this.getMemory(),
          hasResourceId: !!resourceId
        });
        convertedTools = await this.convertTools({
          toolsets,
          clientTools,
          threadId: threadIdToUse,
          resourceId,
          runId,
          runtimeContext
        });
        const messageObjects = [systemMessage, ...(context || []), ...coreMessages];
        return {
          messageObjects,
          convertedTools,
          threadId: threadIdToUse,
          thread
        };
      },
      after: async ({
        result,
        thread: threadAfter,
        threadId: threadId2,
        memoryConfig: memoryConfig2,
        outputText,
        runId: runId2
      }) => {
        const resToLog = {
          text: result?.text,
          object: result?.object,
          toolResults: result?.toolResults,
          toolCalls: result?.toolCalls,
          usage: result?.usage,
          steps: result?.steps?.map(s => {
            return {
              stepType: s?.stepType,
              text: result?.text,
              object: result?.object,
              toolResults: result?.toolResults,
              toolCalls: result?.toolCalls,
              usage: result?.usage
            };
          })
        };
        this.logger.debug(`[Agent:${this.name}] - Post processing LLM response`, {
          runId: runId2,
          result: resToLog,
          threadId: threadId2
        });
        const memory = this.getMemory();
        const thread = threadAfter || (threadId2 ? await memory?.getThreadById({
          threadId: threadId2
        }) : void 0);
        if (memory && resourceId && thread) {
          try {
            const userMessage = this.getMostRecentUserMessage(messages);
            const now = Date.now();
            const threadMessages = this.sanitizeResponseMessages(ensureAllMessagesAreCoreMessages(messages)).map((u, index) => {
              return {
                id: this.getMemory()?.generateId(),
                createdAt: new Date(now + index),
                threadId: thread.id,
                resourceId,
                ...u,
                content: u.content,
                role: u.role,
                type: "text"
              };
            });
            const dateResponseMessagesFrom = (threadMessages.at(-1)?.createdAt?.getTime?.() || Date.now()) + 1;
            void (async () => {
              if (!thread.title?.startsWith("New Thread")) {
                return;
              }
              const config = memory.getMergedThreadConfig(memoryConfig2);
              const title = config?.threads?.generateTitle ? await this.genTitle(userMessage) : void 0;
              if (!title) {
                return;
              }
              return memory.createThread({
                threadId: thread.id,
                resourceId,
                memoryConfig: memoryConfig2,
                title
              });
            })();
            let responseMessages = result.response.messages;
            if (!responseMessages && result.object) {
              responseMessages = [{
                role: "assistant",
                content: [{
                  type: "text",
                  text: outputText
                }]
              }];
            }
            await memory.saveMessages({
              messages: [...threadMessages, ...this.getResponseMessages({
                threadId: threadId2,
                resourceId,
                messages: responseMessages,
                now: dateResponseMessagesFrom
              })],
              memoryConfig: memoryConfig2
            });
          } catch (e) {
            const message = e instanceof Error ? e.message : JSON.stringify(e);
            this.logger.error("Error saving response", {
              error: message,
              runId: runId2,
              result: resToLog,
              threadId: threadId2
            });
          }
        }
        if (Object.keys(this.evals || {}).length > 0) {
          const input = messages.map(message => message.content).join("\n");
          const runIdToUse = runId2 || crypto.randomUUID();
          for (const metric of Object.values(this.evals || {})) {
            executeHook("onGeneration" /* ON_GENERATION */, {
              input,
              output: outputText,
              runId: runIdToUse,
              metric,
              agentName: this.name,
              instructions: instructions || this.instructions
            });
          }
        }
      }
    };
  }
  async generate(messages, generateOptions = {}) {
    const {
      instructions,
      context,
      threadId: threadIdInFn,
      memoryOptions,
      resourceId,
      maxSteps,
      onStepFinish,
      runId,
      output,
      toolsets,
      clientTools,
      temperature,
      toolChoice = "auto",
      experimental_output,
      telemetry,
      runtimeContext = new RuntimeContext(),
      ...rest
    } = Object.assign({}, this.#defaultGenerateOptions, generateOptions);
    let messagesToUse = [];
    if (typeof messages === `string`) {
      messagesToUse = [{
        role: "user",
        content: messages
      }];
    } else if (Array.isArray(messages)) {
      messagesToUse = messages.map(message => {
        if (typeof message === `string`) {
          return {
            role: "user",
            content: message
          };
        }
        return message;
      });
    } else {
      messagesToUse = [messages];
    }
    const runIdToUse = runId || randomUUID();
    const instructionsToUse = instructions || (await this.getInstructions({
      runtimeContext
    }));
    const llm = await this.getLLM({
      runtimeContext
    });
    const {
      before,
      after
    } = this.__primitive({
      instructions: instructionsToUse,
      messages: messagesToUse,
      context,
      threadId: threadIdInFn,
      memoryConfig: memoryOptions,
      resourceId,
      runId: runIdToUse,
      toolsets,
      clientTools,
      runtimeContext
    });
    const {
      threadId,
      thread,
      messageObjects,
      convertedTools
    } = await before();
    if (!output && experimental_output) {
      const result2 = await llm.__text({
        messages: messageObjects,
        tools: convertedTools,
        onStepFinish: result3 => {
          void onStepFinish?.(result3);
        },
        maxSteps,
        runId: runIdToUse,
        temperature,
        toolChoice: toolChoice || "auto",
        experimental_output,
        threadId,
        resourceId,
        memory: this.getMemory(),
        runtimeContext,
        ...rest
      });
      const outputText2 = result2.text;
      await after({
        result: result2,
        threadId,
        thread,
        memoryConfig: memoryOptions,
        outputText: outputText2,
        runId: runIdToUse
      });
      const newResult = result2;
      newResult.object = result2.experimental_output;
      return newResult;
    }
    if (!output) {
      const result2 = await llm.__text({
        messages: messageObjects,
        tools: convertedTools,
        onStepFinish: result3 => {
          void onStepFinish?.(result3);
        },
        maxSteps,
        runId: runIdToUse,
        temperature,
        toolChoice,
        telemetry,
        threadId,
        resourceId,
        memory: this.getMemory(),
        runtimeContext,
        ...rest
      });
      const outputText2 = result2.text;
      await after({
        result: result2,
        thread,
        threadId,
        memoryConfig: memoryOptions,
        outputText: outputText2,
        runId: runIdToUse
      });
      return result2;
    }
    const result = await llm.__textObject({
      messages: messageObjects,
      tools: convertedTools,
      structuredOutput: output,
      onStepFinish: result2 => {
        void onStepFinish?.(result2);
      },
      maxSteps,
      runId: runIdToUse,
      temperature,
      toolChoice,
      telemetry,
      memory: this.getMemory(),
      runtimeContext,
      ...rest
    });
    const outputText = JSON.stringify(result.object);
    await after({
      result,
      thread,
      threadId,
      memoryConfig: memoryOptions,
      outputText,
      runId: runIdToUse
    });
    return result;
  }
  async stream(messages, streamOptions = {}) {
    const {
      instructions,
      context,
      threadId: threadIdInFn,
      memoryOptions,
      resourceId,
      maxSteps,
      onFinish,
      onStepFinish,
      runId,
      toolsets,
      clientTools,
      output,
      temperature,
      toolChoice = "auto",
      experimental_output,
      telemetry,
      runtimeContext = new RuntimeContext(),
      ...rest
    } = Object.assign({}, this.#defaultStreamOptions, streamOptions);
    const runIdToUse = runId || randomUUID();
    const instructionsToUse = instructions || (await this.getInstructions({
      runtimeContext
    }));
    const llm = await this.getLLM({
      runtimeContext
    });
    let messagesToUse = [];
    if (typeof messages === `string`) {
      messagesToUse = [{
        role: "user",
        content: messages
      }];
    } else {
      messagesToUse = messages.map(message => {
        if (typeof message === `string`) {
          return {
            role: "user",
            content: message
          };
        }
        return message;
      });
    }
    const {
      before,
      after
    } = this.__primitive({
      instructions: instructionsToUse,
      messages: messagesToUse,
      context,
      threadId: threadIdInFn,
      memoryConfig: memoryOptions,
      resourceId,
      runId: runIdToUse,
      toolsets,
      clientTools,
      runtimeContext
    });
    const {
      threadId,
      thread,
      messageObjects,
      convertedTools
    } = await before();
    if (!output && experimental_output) {
      this.logger.debug(`Starting agent ${this.name} llm stream call`, {
        runId
      });
      const streamResult = await llm.__stream({
        messages: messageObjects,
        temperature,
        tools: convertedTools,
        onStepFinish: result => {
          void onStepFinish?.(result);
        },
        onFinish: async result => {
          try {
            const outputText = result.text;
            await after({
              result,
              thread,
              threadId,
              memoryConfig: memoryOptions,
              outputText,
              runId: runIdToUse
            });
          } catch (e) {
            this.logger.error("Error saving memory on finish", {
              error: e,
              runId
            });
          }
          void onFinish?.(result);
        },
        maxSteps,
        runId: runIdToUse,
        toolChoice,
        experimental_output,
        memory: this.getMemory(),
        runtimeContext,
        ...rest
      });
      const newStreamResult = streamResult;
      newStreamResult.partialObjectStream = streamResult.experimental_partialOutputStream;
      return newStreamResult;
    } else if (!output) {
      this.logger.debug(`Starting agent ${this.name} llm stream call`, {
        runId
      });
      return llm.__stream({
        messages: messageObjects,
        temperature,
        tools: convertedTools,
        onStepFinish: result => {
          void onStepFinish?.(result);
        },
        onFinish: async result => {
          try {
            const outputText = result.text;
            await after({
              result,
              thread,
              threadId,
              memoryConfig: memoryOptions,
              outputText,
              runId: runIdToUse
            });
          } catch (e) {
            this.logger.error("Error saving memory on finish", {
              error: e,
              runId
            });
          }
          void onFinish?.(result);
        },
        maxSteps,
        runId: runIdToUse,
        toolChoice,
        telemetry,
        memory: this.getMemory(),
        runtimeContext,
        ...rest
      });
    }
    this.logger.debug(`Starting agent ${this.name} llm streamObject call`, {
      runId
    });
    return llm.__streamObject({
      messages: messageObjects,
      tools: convertedTools,
      temperature,
      structuredOutput: output,
      onStepFinish: result => {
        void onStepFinish?.(result);
      },
      onFinish: async result => {
        try {
          const outputText = JSON.stringify(result.object);
          await after({
            result,
            thread,
            threadId,
            memoryConfig: memoryOptions,
            outputText,
            runId: runIdToUse
          });
        } catch (e) {
          this.logger.error("Error saving memory on finish", {
            error: e,
            runId
          });
        }
        void onFinish?.(result);
      },
      runId: runIdToUse,
      toolChoice,
      telemetry,
      memory: this.getMemory(),
      runtimeContext,
      ...rest
    });
  }
  /**
   * Convert text to speech using the configured voice provider
   * @param input Text or text stream to convert to speech
   * @param options Speech options including speaker and provider-specific options
   * @returns Audio stream
   * @deprecated Use agent.voice.speak() instead
   */
  async speak(input, options) {
    if (!this.voice) {
      throw new Error("No voice provider configured");
    }
    this.logger.warn("Warning: agent.speak() is deprecated. Please use agent.voice.speak() instead.");
    try {
      return this.voice.speak(input, options);
    } catch (e) {
      this.logger.error("Error during agent speak", {
        error: e
      });
      throw e;
    }
  }
  /**
   * Convert speech to text using the configured voice provider
   * @param audioStream Audio stream to transcribe
   * @param options Provider-specific transcription options
   * @returns Text or text stream
   * @deprecated Use agent.voice.listen() instead
   */
  async listen(audioStream, options) {
    if (!this.voice) {
      throw new Error("No voice provider configured");
    }
    this.logger.warn("Warning: agent.listen() is deprecated. Please use agent.voice.listen() instead");
    try {
      return this.voice.listen(audioStream, options);
    } catch (e) {
      this.logger.error("Error during agent listen", {
        error: e
      });
      throw e;
    }
  }
  /**
   * Get a list of available speakers from the configured voice provider
   * @throws {Error} If no voice provider is configured
   * @returns {Promise<Array<{voiceId: string}>>} List of available speakers
   * @deprecated Use agent.voice.getSpeakers() instead
   */
  async getSpeakers() {
    if (!this.voice) {
      throw new Error("No voice provider configured");
    }
    this.logger.warn("Warning: agent.getSpeakers() is deprecated. Please use agent.voice.getSpeakers() instead.");
    try {
      return await this.voice.getSpeakers();
    } catch (e) {
      this.logger.error("Error during agent getSpeakers", {
        error: e
      });
      throw e;
    }
  }
  toStep() {
    const x = agentToStep(this);
    return new Step(x);
  }
};
Agent = /*@__PURE__*/(_ => {
  _init = __decoratorStart(_a);
  Agent = __decorateElement(_init, 0, "Agent", _Agent_decorators, Agent);
  __runInitializers(_init, 1, Agent);

  // src/workflows/utils.ts
  return Agent;
})();
function agentToStep(agent, {
  mastra
} = {}) {
  return {
    id: agent.name,
    inputSchema: lib.z.object({
      prompt: lib.z.string(),
      resourceId: lib.z.string().optional(),
      threadId: lib.z.string().optional()
    }),
    outputSchema: lib.z.object({
      text: lib.z.string()
    }),
    execute: async ({
      context,
      runId,
      mastra: mastraFromExecute
    }) => {
      const realMastra = mastraFromExecute ?? mastra;
      if (!realMastra) {
        throw new Error("Mastra instance not found");
      }
      agent.__registerMastra(realMastra);
      agent.__registerPrimitives({
        logger: realMastra.getLogger(),
        telemetry: realMastra.getTelemetry()
      });
      const result = await agent.generate(context.inputData.prompt, {
        runId,
        resourceId: context.inputData.resourceId,
        threadId: context.inputData.threadId
      });
      return {
        text: result.text
      };
    }
  };
}

export { Agent as A, InstrumentClass as I, Telemetry as T, __decorateElement as _, __runInitializers as a, __decoratorStart as b };
