
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Components/TodoItem.svelte generated by Svelte v3.55.1 */

    const { console: console_1$1 } = globals;
    const file$1 = "src/Components/TodoItem.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let button0;
    	let t0;
    	let button0_class_value;
    	let t1;
    	let p;
    	let t2;
    	let t3;
    	let button1;
    	let t4;
    	let button1_class_value;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			t0 = text("Finish");
    			t1 = space();
    			p = element("p");
    			t2 = text(/*nameTodo*/ ctx[0]);
    			t3 = space();
    			button1 = element("button");
    			t4 = text("delete");
    			attr_dev(button0, "class", button0_class_value = "" + (null_to_empty(/*idx*/ ctx[1]) + " svelte-po2tyq"));
    			add_location(button0, file$1, 18, 4, 417);
    			add_location(p, file$1, 19, 4, 489);
    			attr_dev(button1, "class", button1_class_value = "" + (null_to_empty(/*idx*/ ctx[1]) + " svelte-po2tyq"));
    			add_location(button1, file$1, 20, 4, 511);
    			attr_dev(div, "class", div_class_value = "wrapper-todo-block-" + /*idx*/ ctx[1] + " wrapper-todo-block flex flex-row flex-align-baseline" + " svelte-po2tyq");
    			add_location(div, file$1, 17, 0, 321);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, t0);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, t2);
    			append_dev(div, t3);
    			append_dev(div, button1);
    			append_dev(button1, t4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*handlerClickFinish*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*handlerClick*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*idx*/ 2 && button0_class_value !== (button0_class_value = "" + (null_to_empty(/*idx*/ ctx[1]) + " svelte-po2tyq"))) {
    				attr_dev(button0, "class", button0_class_value);
    			}

    			if (dirty & /*nameTodo*/ 1) set_data_dev(t2, /*nameTodo*/ ctx[0]);

    			if (dirty & /*idx*/ 2 && button1_class_value !== (button1_class_value = "" + (null_to_empty(/*idx*/ ctx[1]) + " svelte-po2tyq"))) {
    				attr_dev(button1, "class", button1_class_value);
    			}

    			if (dirty & /*idx*/ 2 && div_class_value !== (div_class_value = "wrapper-todo-block-" + /*idx*/ ctx[1] + " wrapper-todo-block flex flex-row flex-align-baseline" + " svelte-po2tyq")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TodoItem', slots, []);
    	let { nameTodo } = $$props;
    	let { idx } = $$props;
    	let { handlerDelete } = $$props;
    	let { handlerFinish } = $$props;

    	const handlerClick = () => {
    		console.log(idx);
    		handlerDelete(idx);
    	};

    	const handlerClickFinish = () => {
    		console.log(idx);
    		handlerFinish(idx);
    	};

    	$$self.$$.on_mount.push(function () {
    		if (nameTodo === undefined && !('nameTodo' in $$props || $$self.$$.bound[$$self.$$.props['nameTodo']])) {
    			console_1$1.warn("<TodoItem> was created without expected prop 'nameTodo'");
    		}

    		if (idx === undefined && !('idx' in $$props || $$self.$$.bound[$$self.$$.props['idx']])) {
    			console_1$1.warn("<TodoItem> was created without expected prop 'idx'");
    		}

    		if (handlerDelete === undefined && !('handlerDelete' in $$props || $$self.$$.bound[$$self.$$.props['handlerDelete']])) {
    			console_1$1.warn("<TodoItem> was created without expected prop 'handlerDelete'");
    		}

    		if (handlerFinish === undefined && !('handlerFinish' in $$props || $$self.$$.bound[$$self.$$.props['handlerFinish']])) {
    			console_1$1.warn("<TodoItem> was created without expected prop 'handlerFinish'");
    		}
    	});

    	const writable_props = ['nameTodo', 'idx', 'handlerDelete', 'handlerFinish'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<TodoItem> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('nameTodo' in $$props) $$invalidate(0, nameTodo = $$props.nameTodo);
    		if ('idx' in $$props) $$invalidate(1, idx = $$props.idx);
    		if ('handlerDelete' in $$props) $$invalidate(4, handlerDelete = $$props.handlerDelete);
    		if ('handlerFinish' in $$props) $$invalidate(5, handlerFinish = $$props.handlerFinish);
    	};

    	$$self.$capture_state = () => ({
    		nameTodo,
    		idx,
    		handlerDelete,
    		handlerFinish,
    		handlerClick,
    		handlerClickFinish
    	});

    	$$self.$inject_state = $$props => {
    		if ('nameTodo' in $$props) $$invalidate(0, nameTodo = $$props.nameTodo);
    		if ('idx' in $$props) $$invalidate(1, idx = $$props.idx);
    		if ('handlerDelete' in $$props) $$invalidate(4, handlerDelete = $$props.handlerDelete);
    		if ('handlerFinish' in $$props) $$invalidate(5, handlerFinish = $$props.handlerFinish);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [nameTodo, idx, handlerClick, handlerClickFinish, handlerDelete, handlerFinish];
    }

    class TodoItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			nameTodo: 0,
    			idx: 1,
    			handlerDelete: 4,
    			handlerFinish: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TodoItem",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get nameTodo() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nameTodo(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get idx() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set idx(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handlerDelete() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handlerDelete(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handlerFinish() {
    		throw new Error("<TodoItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handlerFinish(value) {
    		throw new Error("<TodoItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.55.1 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i].idx;
    	child_ctx[11] = list[i].name;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i].idx;
    	child_ctx[11] = list[i].name;
    	return child_ctx;
    }

    // (99:3) {#each toDoList as { idx, name }}
    function create_each_block_1(ctx) {
    	let todoitem;
    	let current;

    	todoitem = new TodoItem({
    			props: {
    				nameTodo: /*name*/ ctx[11],
    				idx: /*idx*/ ctx[10],
    				handlerDelete: /*handlerDelete*/ ctx[2],
    				handlerFinish: /*handlerFinish*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(todoitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(todoitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const todoitem_changes = {};
    			if (dirty & /*toDoList*/ 2) todoitem_changes.nameTodo = /*name*/ ctx[11];
    			if (dirty & /*toDoList*/ 2) todoitem_changes.idx = /*idx*/ ctx[10];
    			todoitem.$set(todoitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todoitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todoitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(todoitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(99:3) {#each toDoList as { idx, name }}",
    		ctx
    	});

    	return block;
    }

    // (110:3) {#each finishedList as { idx, name }}
    function create_each_block(ctx) {
    	let todoitem;
    	let current;

    	todoitem = new TodoItem({
    			props: {
    				nameTodo: /*name*/ ctx[11],
    				idx: /*idx*/ ctx[10],
    				handlerDelete: /*handlerDelete*/ ctx[2],
    				handlerFinish: /*handlerFinish*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(todoitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(todoitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const todoitem_changes = {};
    			if (dirty & /*finishedList*/ 1) todoitem_changes.nameTodo = /*name*/ ctx[11];
    			if (dirty & /*finishedList*/ 1) todoitem_changes.idx = /*idx*/ ctx[10];
    			todoitem.$set(todoitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todoitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todoitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(todoitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(110:3) {#each finishedList as { idx, name }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let input;
    	let t0;
    	let button;
    	let t2;
    	let div3;
    	let div1;
    	let h10;
    	let t4;
    	let t5;
    	let div2;
    	let h11;
    	let t7;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*toDoList*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = /*finishedList*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Create";
    			t2 = space();
    			div3 = element("div");
    			div1 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Todo";
    			t4 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t5 = space();
    			div2 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Finished";
    			t7 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "newTask");
    			attr_dev(input, "placeholder", "Write wour task here");
    			add_location(input, file, 92, 2, 1753);
    			add_location(button, file, 93, 2, 1828);
    			attr_dev(div0, "class", "wrapper-create-task");
    			add_location(div0, file, 91, 1, 1717);
    			attr_dev(h10, "class", "svelte-1tky8bj");
    			add_location(h10, file, 97, 3, 1981);
    			attr_dev(div1, "class", "wrapper-todo");
    			add_location(div1, file, 96, 2, 1951);
    			attr_dev(h11, "class", "svelte-1tky8bj");
    			add_location(h11, file, 108, 3, 2179);
    			attr_dev(div2, "class", "wrapper-done");
    			add_location(div2, file, 107, 2, 2149);
    			attr_dev(div3, "class", "wrapper-container-tasks flex flex-justify-around");
    			add_location(div3, file, 95, 1, 1886);
    			attr_dev(main, "class", "svelte-1tky8bj");
    			add_location(main, file, 90, 0, 1709);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, input);
    			append_dev(div0, t0);
    			append_dev(div0, button);
    			append_dev(main, t2);
    			append_dev(main, div3);
    			append_dev(div3, div1);
    			append_dev(div1, h10);
    			append_dev(div1, t4);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, h11);
    			append_dev(div2, t7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handlerCreate*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*toDoList, handlerDelete, handlerFinish*/ 14) {
    				each_value_1 = /*toDoList*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*finishedList, handlerDelete, handlerFinish*/ 13) {
    				each_value = /*finishedList*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div2, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const taskNames = new Set();
    	let finishedList = [];
    	let toDoList = [];
    	let count = 0;

    	const updateToDo = task => {
    		const data = task ? [...toDoList, task] : [...toDoList];
    		$$invalidate(1, toDoList = data);
    	};

    	const updateFinished = task => {
    		const data = task ? [...finishedList, task] : [...finishedList];
    		$$invalidate(0, finishedList = data);
    	};

    	const handlerDelete = idx => {
    		toDoList.forEach(task => {
    			if (task.idx === idx) {
    				$$invalidate(1, toDoList = toDoList.filter(item => item !== task));
    				console.log(toDoList);
    				updateToDo();
    				taskNames.delete(task.name);
    				console.log(task);
    			}
    		});

    		finishedList.forEach(task => {
    			if (task.idx === idx) {
    				$$invalidate(0, finishedList = finishedList.filter(item => item !== task));
    				updateFinished();
    				console.log(task);
    			}
    		});

    		updateToDo();
    	};

    	const handlerFinish = idx => {
    		toDoList.forEach(task => {
    			if (task.idx === idx) {
    				handlerDelete(idx);
    				updateToDo();
    				finishedList.push(task);
    				updateFinished();
    			}
    		});
    	};

    	const handlerFinishBack = idx => {
    		
    	};

    	const handlerCreate = () => {
    		let { value } = document.querySelector(".newTask");
    		if (!value) return;

    		if (taskNames.has(value)) {
    			console.log(`Task "${value}" already exists.`);
    			return;
    		}

    		taskNames.add(value);
    		const task = { idx: count, name: value, handlerDelete };
    		console.log(value);
    		count += 1;
    		updateToDo(task);
    		value = document.querySelector(".newTask").value = "";
    		console.log(toDoList);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		TodoItem,
    		taskNames,
    		finishedList,
    		toDoList,
    		count,
    		updateToDo,
    		updateFinished,
    		handlerDelete,
    		handlerFinish,
    		handlerFinishBack,
    		handlerCreate
    	});

    	$$self.$inject_state = $$props => {
    		if ('finishedList' in $$props) $$invalidate(0, finishedList = $$props.finishedList);
    		if ('toDoList' in $$props) $$invalidate(1, toDoList = $$props.toDoList);
    		if ('count' in $$props) count = $$props.count;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [finishedList, toDoList, handlerDelete, handlerFinish, handlerCreate];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
