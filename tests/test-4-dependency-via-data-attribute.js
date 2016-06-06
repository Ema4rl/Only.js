$O
    .test('.form')
    .js("in-existent-1.js") // should not load, '.form' does not exist
    .js("in-existent-2.js") // should not load, '.form' does not exist
    .js("in-existent-3.js") // should not load, '.form' does not exist
    .wait(done)
    .test('form')
    .js("test-2-form-plugin.js")// should load, the element does exist (waits for dom ready)
    .js("test-3-form-plugin.js")// should load, the element does exist (waits for dom ready)
    .wait(done)
    .js("test-3-dependency-chaining.js") // should load since it does not depend on an element (should load before test-2-form-plugin.js)
    .wait(done);
