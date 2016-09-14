// var newFn = newFn || function (fn) {
var newFn = (function () {
    function NewFnError(message) {
        this.message = message;
    }
    Object.setPrototypeOf(NewFnError, Error);

    function TYPES(defaultValue) {
        return { defaultValue: defaultValue };
    }
    TYPES.none = 0;
    TYPES.string = 1;
    TYPES.number = 2;
    TYPES.bool = 3;
    TYPES.obj = 4;
    TYPES.fn = 5;
    TYPES.array = 6;
    TYPES.req = {
        none: 10,
        string: 11,
        number: 12,
        bool: 13,
        obj: 14,
        fn: 15,
        array: 16
    }

    function validate(paramsDefn, x) {
        var res = x;
        for (i in paramsDefn) {
            if (typeof x[i] == 'undefined' && typeof paramsDefn[i] == 'object') {
                x[i] = paramsDefn[i].defaultValue;
            }
        }
        return x;
    }

    function f(x, y) {
        var paramsDefn, body, fn;
        if (typeof x == 'function') {
            if (typeof y == 'undefined') {
                fn = x;
            } else if (typeof y == 'function') {
                paramsDefn = x;
                body = y;
                var fn = function (x) {
                    if (typeof x == 'undefined') {
                        x = {};
                    }
                    x = validate(paramsDefn(TYPES), x);
                    return body(x);
                };
            } else {
                throw new NewFnError('Argument 2 must be a function');
            }
        } else if (typeof x != 'undefined') {
            throw new NewFnError('Argument 1 must be a function');
        } else {
            throw new NewFnError('Expected 1 or 2 arguments');
        }
        var result = x => /* add .info to view args */ fn(x);
        result.info = paramsDefn;
        Object.freeze(result);
        return result;
    }

    var result = (x,y) => /*
Type newFn.info to learn more!
*/f(x,y);

    result.info = '[newFn]'
    + '\n The New Function Builder Helper'
    + '\n'
    + '\n Build a function with 1 OR 2 below:'
    + '\n   1. var myFn = newFn(body_function);'
    + '\n   2. var myFn = newFn(f => params_object, body_function);'
    + '\n'
    + '\n Use the function with 1 OR 2 below:'
    + '\n   1. myFn(optional_parameter);'
    + '\n   2. myFn({ paramName1: \'Value 1\', paramName2: 2, ... })'
    + '\n';

    Object.freeze(result);
    return result;
})();


var mylib = {};
mylib.someFunction = newFn(f => ({
    'one_string': f.string,
    'one_number': f.number,
    'one_bool': f.bool,
    'one_obj': f.obj,
    'one_fn': f.fn,
    'one_array': f.array,
    'req_bool': f.req.bool
}), arg => {
    console.log('Function Body');
    console.log('  String:', arg.one_string);
    console.log('  Number:', arg.one_number);
    console.log('    Bool:', arg.one_bool);
    console.log('     Obj:', arg.one_obj);
    console.log('      Fn:', arg.one_fn);
    console.log('   Array:', arg.one_array);
    console.log('REQ Bool:', arg.req_bool);
    return 'Function Return';
});

var r = mylib.someFunction({
    one_string: 'XXXX',
    one_number: 1234,
    one_bool: true,
    one_obj: { some: 'object' },
    one_fn: function () { console.log('somefunc'); },
    one_array: [ 1, 2, 'three' ],
    req_bool: false
});
console.log('--> Return:', r);


var double = newFn(x => {
    return 2 * x;
});
console.log('double(3) =', double(3));

var max = newFn(x => {
    return Math.max.apply(this, x);
});
console.log('max([ 12,20,3 ]) =', max([ 12,20,3 ]) );

var translate2d = newFn(f => ({ x: f.req.number, y: f.req.number, dx: f(0), dy: f(0), invert: f(false) }), f => {
    var mult = f.invert ? -1 : 1;
    var r = { x: f.x + mult*f.dx, y: f.y + mult*f.dy };
    return r;
});
console.log('translate2d({ x:10, dx:1, y:20, dy:-2 }) =', translate2d({ x:10, dx:1, y:20, dy:-2 }) );
console.log('translate2d({ x:10, y:20, dy:5, invert:true }) =', translate2d({ x:10, y:20, dy:5, invert:true }) );

var greet = newFn(f => ({ honorific: f(''), name: f('you') }), f => {
    return 'Hey, ' + (f.honorific + ' ' + f.name).trim() + '! How are you doing?';
});
console.log("greet({ honorific: 'Mr.', name: 'John' })");
console.log( greet({ honorific: 'Mr.', name: 'John' }) );
console.log("greet({ name: 'Mary' })");
console.log( greet({ name: 'Mary' }) );
console.log('greet()');
console.log( greet() );
