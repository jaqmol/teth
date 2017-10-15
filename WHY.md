# why teth?

> The last thing you wanted any programmer to do is mess with internal state even if presented figuratively. – Alan C. Kay, [The Early History Of Smalltalk](http://worrydream.com/EarlyHistoryOfSmalltalk)

**Teth** is an attempt to bring a couple of overlooked concepts to attention, that have a profound positive effect on speed of development, accuracy of abstraction and robustness of resulting application. JavaScript was chosen as a basis due to it's pervasiveness and strong background in Lisp and Smalltalk.

The concepts behind Teth where learned from almost 2 decades of experience with application development frameworks (on OS/2, Windows/COM, System 8, Cocoa (Touch), Android, Qt, AngularJS, React). Many of the causes for errors made far too often in application code originate in sketchy abstractions introduced by the frameworks and APIs themselves, bleeding into the application code from underneath.

The majority of the mainstream approaches neglect fundamental principles of Object-Orientated Design and Functional Programming, namely:

- Messaging
- First-Class-Functions
- Composition
- Delegation

... while emphasising deceptive concepts like Inheritance, Polymorphism and Strong Typing. While the obvious main driver "resource efficiency" was understandable, misunderstanding of Object-Oriented-Design and arrogant ignorance towards alternative concepts for purely formal reasons (see Lisp vs. Smalltalk vs. Algol syntax) are not.

A turnaround is perceivable in recent years and it becomes apparent that nowadays almost extinct programming environments like Smalltalk, Lisp or Eiffel represent in ways superior approaches towards object orientated design, as well as concerning their leading principles in framework architecture. Many of the failures repeated over and over again by mainstream frameworks and APIs where solved in Smalltalk and Lisp, often decades before nowadays mainstream environments where perceived. The people behind Smalltalk and Lisp made those errors as well, but they recovered from them, understood the causes and redesigned their works. A similar recovery was not observed in the mainstream for decades. Fortunately many of the "old ways" are now rediscovered and enter the mainstream.

# why T?

Static/strong typing does not guarantee program correctness per se. Popular preprocessor-languages compiling to JS fail to make substantial contributions to fix complexity- and robustness-problems.

> "Static Types Give You a False Sense of Security" — Eric Elliot, [The Shocking Secret About Static Types](https://medium.com/javascript-scene/the-shocking-secret-about-static-types-514d39bf30a3)

> “Whilst not conclusive, the lack of evidence in the charts that more advanced type languages are going to save us from writing bugs is very disturbing.” — Daniel Lebrero, [The broken promise of static typing](https://labs.ig.com/static-typing-promise)

Expressing everything as an improperly named class and casting business logic throughout deep and poorly conceived inheritance trees, have rendered countless software-projects nearly unmaintainable.

**Teth** and **T** take a different path by emphasising the following aspects:

- Test-Driven-Development with Functional-Reactive Programming
- Entry Conditions and Computational Contexts
- Explicit State Mutations without Side-Effects

[BACK TO README](README.md)
