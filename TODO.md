# NEXT

1. *DONE: For testing and simulation use "npm install tiny-worker --save-dev"*
2. The resonator gets activated as soon as the 1st file path was registered with the resonate function
3. Before that point in time, it's a pass through function or alike in the DSL
4. When the resonator is active, every send and circular posts the messages to all registered resonating files
5. More than one response must causes a raise in the main thread then

# ON SUCCESS NEXT

1. Implement pipe system
2. Supports Map_reduce-API in addition to Promise-API:
  1. pipe.all
  2. pipe.race
  3. pipe.reject
  4. pipe.resolve
  5. pipe.composit.then
  6. pipe.composit.catch
  7. pipe.composit.forEach
  6. pipe.composit.map
  7. pipe.composit.reduce
