# why teth?

Teth conceptually, was conceived as reaction on extended experiences with application development frameworks (Cocoa(Touch), Android, Qt, AngularJS, React). Many of the errors seen far too often in application code seem to fit into overlapping patterns (independent of framework).

It seems mainstream approaches towards object orientation tempt programmers to overcomplicate solutions. Tight schedules in interaction with neglected refactoring worsen the situation further. Not to speak of the knotty internal state left behind. Stepchild code like that often leaves the impression to be functional only by accident, not on purpose.

> The last thing you wanted any programmer to do is mess with internal state even if presented figuratively. – Alan C. Kay, [The Early History Of Smalltalk](http://worrydream.com/EarlyHistoryOfSmalltalk)

**Teth** is the attempt to lay a foundation to do better.

# why T?

Static/strong typing does not guarantee program correctness per se. Popular preprocessor-languages compiling to JS fail to make substantial contributions to fix complexity- and robustness-problems.

> "Static Types Give You a False Sense of Security" — Eric Elliot, [The Shocking Secret About Static Types](https://medium.com/javascript-scene/the-shocking-secret-about-static-types-514d39bf30a3)

> “Whilst not conclusive, the lack of evidence in the charts that more advanced type languages are going to save us from writing bugs is very disturbing.” — Daniel Lebrero, [The broken promise of static typing](https://labs.ig.com/static-typing-promise)

Expressing everything as a improperly named class and casting business logic throughout deep and poorly conceived inheritance trees, have rendered countless software-projects nearly unmaintainable.

**Teth** and **T** take a different path by emphasising the following aspects:

- Test-Driven-Development with Functional-Reactive Programming
- Entry Conditions and Computational Contexts
- Explicit State Mutations without Side-Effects

Many of the important aspects in **T** and **teth** are only possible to achieve in JavaScript.

[BACK TO README](README.md)
