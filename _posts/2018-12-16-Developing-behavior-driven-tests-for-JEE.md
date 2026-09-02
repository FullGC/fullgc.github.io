---
title:       "Behavior-driven tests for JEE with JBehave — Part 1"
part_title:  "Terminology, tools and the 'Volcano' stories"
description: >-
  JBehave and Thucydides for BDD on a JEE web app: the terminology that matters, how
  the toolchain fits together, and the 'Volcano' stories used throughout.
permalink:   /developing-behavior-with-jbehave-part-1/
date:        2018-12-19 14:05:45
series:      "Behavior-driven Tests for JEE with JBehave"
part:        1
tags:        [jee, java, jbehave, bdd, automation, tests]
image:       /img/behave-color.jpg
image_w:     1016
image_h:     594
---

Behavior-driven development, or BDD, is an agile software development process that provides the developers, QA, project managers and business team with a shared tool-set and process for software development collaboration.

In this guide, we'll learn to design, develop and automate [Black-box](https://en.wikipedia.org/wiki/Black-box_testing) tests for a JEE web application in a [BDD](https://en.wikipedia.org/wiki/Behavior-driven_development) fashion. We’ll develop on top of [Jbehave](https://jbehave.org/) framework.

<br><br>
---

## Glossary

------------------------------------------------------------------------------------------
### Black-box testing

According to Wikipedia, "Black-box testing is a method of software testing that examines the functionality of an application without peering into its internal structures or workings". As such, Black-box testing focuses entirely on the inputs and outputs of the software system – the “black box”.

<br><br>
### Behavior-driven development(BDD)

Behavior-driven development is an extension of [test-driven development](https://en.wikipedia.org/wiki/Test-driven_development) that makes use of a simple, domain-specific scripting language.

In BDD, you describe what you want the system to do by talking through example behavior. Work from the outside-in to implement those behaviors using examples to validate you're what you're building.

The customer (who may be a Scrum Product Owner) describes what they want, and the developers ask questions to flesh out enough detail about the behavior to be able to implement it". ([BDD in a nutshell](http://agilecoach.typepad.com/agile-coaching/2012/03/bdd-in-a-nutshell.html))

Structure:

* A BDD **story** is a description of a requirement and its business benefit, and a set of criteria by which we all agree that it is "done". There should be a story for each feature.

* A Story consists of a **narrative** and one or more **scenarios**.

* A narrative is a short, simple description of a feature told from *the perspective of a person or role that requires the new functionality*. The narrative shifts the focus from writing features to discussing them ([technologyconversations.com](https://technologyconversations.com/2013/11/17/behavior-driven-development-bdd-value-through-collaboration-part-2-narrative/)).

* A scenario consists of **steps**, in the format of **'Given-When-Then'**. ‘Given’ and ‘When’ trigger actions, and ‘Then’ is the verification:

![The behavior-driven development cycle]({{ '/public/dB6XOsGGWuUM1t1RHDV3g_img_0.jpg' | relative_url }})

<br><br>
## Frameworks and Tools

------------------------------------------------------------------------------------------
### Jbehave in a nutshell

[JBehave](https://jbehave.org/) is an open-source framework for Behavior-Driven Development.

It supports Java-based development, and plain English is used to form the story.

The steps in the story are visually linked to a corresponding Java method:

![A JBehave story step linked to its corresponding Java implementation method]({{ '/public/dB6XOsGGWuUM1t1RHDV3g_img_1.png' | relative_url }})

JBehave supports multiple mechanisms for parameter injection. In the above example, the 'user' and ‘password’ as arguments extracted from the @When step, with the @named annotation, following a natural order to the parameters in the annotated Java method.

In addition, Jbehave provides an easy way to create more intelligent data types than these strings. There are multiple plugins for generating comprehensive and interactive reports.

There are many (many!) advanced features that are worth checking out (see advanced topics in the [Jbehave site](https://jbehave.org/reference/stable/reporting-stories.html)); we'll only be using a few of them. We’ll explain how Jbehave works at a lower level later.

<br><br>
### Thucydides

Thucydides is a tool designed to make writing automated acceptance tests easier.

Thucydides and JBehave work well together. Thucydides uses simple conventions to make it easier to get started in writing and implementing JBehave stories. It reports on both JBehave and Thucydides steps, which can be seamlessly combined in the same class.


<br><br>
### **Requirements and tools**

* There are JBehave plugins for IntelliJ-Idea and Eclipse. Both come with a custom JBehave Story Editor which provides a syntax highlighting, step hyperlink detection and link to corresponding Java method, step autocompletion, detecting both unimplemented steps and more. Hence, one of these IDE is required.

* We use maven for import libraries, build, run and automated tests

* You can download and follow the source code through the guide. The dispatcher of the 'tests' module is written in Scala. To run it you’ll need a Scala SDK.


<br><br>
### Jbehave Plugin and the 'Volcano' Stories
------------------------------------------------------------------------------------------

We use Idea IntelliJ-IDE with 'Jbehave support' plugin for writing the stories and the code behind.

#### Volcano

'Volcano' is intended to be a social network for Volcano enthusiasts.

The project manager of 'Volcano' would like to add some basic features and behaviors:

1. User account

    1. Registration to 'Volcano'.

    2. Change password.

2. User network

    3. Add a new friend.

Each feature will be described in it's own Jbehave story file. Here is how the "Registration" story looks like before applying the '‘Jbehave support’’ plugin:

![The Registration JBehave story file before the JBehave IDE support plugin is applied]({{ '/public/dB6XOsGGWuUM1t1RHDV3g_img_2.png' | relative_url }})

And after:

![The same Registration story after the JBehave plugin adds step highlighting]({{ '/public/dB6XOsGGWuUM1t1RHDV3g_img_3.png' | relative_url }})

At this stage the steps are marked in red, and we get a message when the mouse hovers that there is no Java method that linked with the steps.

#### Initial Dependencies

Here Thucydides kicks in.

We'll use '*net.thucydides’* libraries for the implementation.

The following Jbehave plugin artifact:

````xml
<groupId>net.thucydides</groupId>
<artifactId>thucydides-jbehave-plugin</artifactId>
````


This includes the Jbehave libraries that are required for the Java implementation code behind:

  ![Maven dependencies required for JBehave and the Java step implementations]({{ '/public/dB6XOsGGWuUM1t1RHDV3g_img_4.png' | relative_url }})

'Jbehave-core' provides the basic Jbehave BDD building blocks: The @Given @When @Then Annotations, and the annotations responsible for the parameter injection (i.e. @Named) ‘Jbehave-junit-runner’ provides functionality for the story and scenarios lifecycle and reporting.

Later on, we'll use it to identify the stories and run the test.

<br><br>
### Next

In [Part-2]({{ '/developing-behavior-with-jbehave-part-2/' | relative_url }}) we'll implement the 'Registration’ story, and review solutions to the implementation challenges.
