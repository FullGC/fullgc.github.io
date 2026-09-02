---
title:       "Behavior-driven tests for JEE with JBehave — Part 3"
part_title:  "Automating tests and generating reports"
description: >-
  Automating a JBehave suite: map stories to step methods, run them against a live
  server, and generate the interactive Thucydides reports teams read.
permalink:   /developing-behavior-with-jbehave-part-3/
date:        2018-12-19 14:15:45
series:      "Behavior-driven Tests for JEE with JBehave"
part:        3
tags:        [jee, java, jbehave, bdd, automation, tests]
image:       /img/behave-color.jpg
image_w:     1016
image_h:     594
---

<br><br>
Previously, we implemented the step cases in a Java code.
In this part we'll learn how to automate them and generate informative reports at the end of the run.

-----------------------------------------------------------------------------------------------------
## Identify implementation methods

You may recall we mentioned that Jbehave registered the Java implementation methods on start up. But how does it identify an implementation step?

Basically, these methods would have to override the configuration() method, which is part of the jbehave library. We have however, let 'thucydides' work for us. The ‘thucydides-core’ library (that comes with the ‘jbehave-plugin’), provides the ‘ThucydidesJUnitStories’ class. This identifies the ‘.story’ files and the links for the Java implementations. All we need is to have a Java class that inherits from it in the Java implementation root package:

````java
import net.thucydides.jbehave.ThucydidesJUnitStories;
public class ApiBDDTestSuite extends ThucydidesJUnitStories {}
````

### Final project structure:

![Final project structure of the JBehave and Thucydides test suite]({{ '/public/dB6XOsGGWuUM1t1RHDV3g_img_6.png' | relative_url }})

<br><br>
## Running the tests

At this point, we can run the tests as Junit.

-----------------------------------------------------------------------------------------------------
### Running the tests manually

In order for the black-box tests to pass, we need to have a server up and running. To run the tests with the IDE, right click on the 'jbehave' package.

![Running the JBehave suite from the IDE by right-clicking the jbehave package]({{ '/public/dB6XOsGGWuUM1t1RHDV3g_img_7.png' | relative_url }})

In this fashion, we can run the tests quickly, debugging them and the server.

<br><br>
### Automate the tests with Jetty(Maven plugin)

What we really want is to test the Volcano server as part of the maven build, the 'maven compile' task.
In this case, we need maven to start a Volcano HTTP server, run the tests, and get Volcano down.

[Eclipse Jetty](https://www.eclipse.org/jetty/) is an open-source project providing an HTTP server and javax.servlet container
We'll use a Jetty maven-plugin, to start a Volcano server on which the tests will be running.

The maven plugin should be configured as follows:

````xml
<plugin>
   <groupId>org.eclipse.jetty</groupId>
   <artifactId>jetty-maven-plugin</artifactId>
   <version>${jetty.version}</version>
   <configuration>
       <httpConnector>
           <port>8083</port>
       </httpConnector>
       <scanIntervalSeconds>0</scanIntervalSeconds>
       <stopKey>stopApiTestEnv</stopKey>
       <stopPort>9999</stopPort>
       <jvmArgs>-Xms1024m -Xmx2048m -XX:PermSize=256M -XX:MaxPermSize=512M</jvmArgs>
       <contextHandlers>
           <contextHandler implementation="org.eclipse.jetty.maven.plugin.JettyWebAppContext">
               <war>${project.basedir}/../volcano_core/target/volcano_core-1.2-SNAPSHOT.war</war>
               <contextPath>/volcano</contextPath>
           </contextHandler>
       </contextHandlers>
   </configuration>
   <executions>
       <execution>
           <id>start-jetty</id>
           <phase>pre-integration-test</phase>
           <goals>
               <goal>start</goal>
           </goals>
       </execution>
       <execution>
           <id>stop-jetty</id>
           <phase>post-integration-test</phase>
           <goals>
               <goal>stop</goal>
           </goals>
       </execution>
   </executions>
</plugin>
````

Note that:

1. The server's port needs to be available, you may want to declare a different port from the default that your server is using.

2. The memory you declare allocated with the jvmargs needs to be enough to get the server up

3. In 'contextHandlers' we provide the web application archive to be used. If you have multiple web modules in your project that need to be tested, provide them all.

4. In the executions section we tell jetty to start before the tests are executed and stop afterwards. If we don't explicitly ask that, then the jetty would stay up.

<br><br>
## Test Summary Reports

Test Summary Reports are an important deliverable. They are needed to reflect test results in a clear way, allowing them to be analyzed quickly.

Jbehave [storyReporter](https://jbehave.org/reference/stable/reporting-stories.html) supports many report formats and will generate the reports for each step and story automatically after the tests have been completed in the /target/jbehave folder.

We'll use another Thucydides maven plugin to generate some better-looking reports:

````xml
<plugin>
   <groupId>org.apache.maven.plugins</groupId>
   <artifactId>maven-site-plugin</artifactId>
   <version>3.2</version>
   <configuration>
       <reportPlugins>
           <plugin>
               <groupId>net.thucydides.maven.plugins</groupId>
               <artifactId>maven-thucydides-plugin</artifactId>
               <version>${thucydides.version}</version>
           </plugin>
       </reportPlugins>
   </configuration>
</plugin>
````

This will generate various reports automatically at the end of the Maven run, in /target/site.

The 'index.html' file that has been created is the most comprehensive, interactive report:

![The generated Thucydides index.html report summarising every test story]({{ '/public/dB6XOsGGWuUM1t1RHDV3g_img_8.png' | relative_url }})

A click on the 'change password' test (story) for example, would provide some additional data on each step result.

![Thucydides report drilled into the 'change password' story, showing per-step results]({{ '/public/dB6XOsGGWuUM1t1RHDV3g_img_9.png' | relative_url }})

You can zoom in with a click on the various test components to get results and statistics.

<br><br>
## Wrapping up

Behavior Driven Development is a methodology for developing software through example-based communication among developers, QAs, and project managers.

With Jbehave, this means writing Given-When-Then scenarios to illustrate examples in a plain text, which links to Java implementation methods.

As part of our mission to create Blackbox tests in a BDD fashion for the Volcano application, we've covered some test cases, discussed design and challenges, and reviewed some post-compilation reports.

------------------------------------------------------------------------------------------

*The complete code can be found in my [GitHub](https://github.com/FullGC/volcano)*.