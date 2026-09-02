---
title:       "Stackable Traits pattern in Scala — Part 2"
part_title:  "Gathering metrics with stackable actors"
description: >-
  Stackable actor traits in Akka: gather per-actor metrics without touching business
  logic, using the trait-stacking pattern from Part 1 on a real integration.
permalink:   /stackable-traits-pattern---part-2/
date:        2018-07-23 14:30:45
series:      "Stackable Traits in Scala"
part:        2
tags:        [scala, stackable, traits, akka]
image:       /img/burger-stack12.jpg
image_w:     1200
image_h:     378
---

Stackable traits can be applied to actors as well.
Specifically, we can use stackable actor traits to modify the behavior of the ‘receive’ method.

<br><br>
We like to gather the following metrics

* time-in-mailbox: The time from the moment a message was enqueued into an actor’s mailbox until the moment it was dequeued for processing.

* processing-time:How long did it take for the actor to process a message.

And to log when an actor starts handling a message and before it finishes.

<br><br>
## **Stackable Actors-based implementation**

Say we have the following actor that we like to monitor:

````scala
abstract class MyActor extends Actor with StrictLogging {
 override def receive: Receive = {
   case message => logger.info("performing some work...")
 }
}
````

Let’s start with the ‘time-in-mailbox’ metric. The simplest way to implement it is to take the time before the message was sent and calculate the time in the mailbox when the actor starting processing it. For the sake of example, we’ll assume that a message was created just before it was sent.

The message class that should be monitored is:

````scala
trait RecordableMessage extends RichMessage {
  val dispatchTime: Long =
  System.currentTimeMillis()
}
trait RichMessage {
  val messageName: String
}
````

We initialized the time before the message was sent, and gave it a name, to be used as a tag for the metric.

Next, create the stackable trait for monitoring the actor on RecordableMessage

````scala
trait LatencyRecorderActor extends Actor with StrictLogging {
 val actorName: String = this.getClass.getSimpleName

 abstract override def receive: Receive = {
   case recordableMessage: RecordableMessage =>
     Monitor.record("time-in-mailbox", actorName, recordableMessage.messageName,
        recordableMessage.dispatchTime)
     val start = System.currentTimeMillis()
     super.receive(recordableMessage)
     Monitor.record("processing-time", actorName, recordableMessage.messageName, start)
   case message => super.receive(message)
 }
}
````

You might notice that

1. As discussed in [Part-1]({{ '/stackable-traits-pattern/' | relative_url }}), the modifier of the ‘receive’ method should be “abstract override”

2. We gather the metrics only on the 'RecordableMessage' message

3. For calculating 'time-in-mailbox', 'dispatchTime' is used

4. For calculating 'processing-time', we take time before invoking the action, then invoking the action, and record the ‘processing-time’ when it finished.

The LoggerActor is the following 

````scala
trait LoggerActor extends Actor with StrictLogging {
 abstract override def receive: Receive = {
   case recordableMessage: RecordableMessage =>
     logger.info(s"handling message: ${recordableMessage.messageName}")
     super.receive(recordableMessage)
     logger.info(s"done handling message: ${recordableMessage.messageName}")
   case message => super.receive(message)
 }
}
````
Lastly, mix these traits to a concrete MyActor class

````scala
class MyMonitoredActor extends MyActor with LatencyRecorderActor with LoggerActor
````

And we ended up with:

<script src="https://gist.github.com/FullGC/c5b032b495b71aa9f80daced5618bf02.js"></script>


<br><br>
## **Try it out**

Create a concrete RecordableMessage:

````scala
case class SomeRecordableMessage() extends RecordableMessage {
   override val messageName: String =
   this.getClass.getSimpleName
}
````

And send it to a MonitoredActor instance

````scala
val actorSystem = ActorSystem("system")
val myMonitoredActor = actorSystem.actorOf(Props[MyMonitoredActor])
myMonitoredActor ! SomeRecordableMessage()
````

Results with the following printed to the log:

````
handling message: SomeTriggerMessage
time-in-mailbox latency for message SomeTriggerMessage in actor MyMonitoredActor is 102
performing some work...
processing-time latency for message SomeTriggerMessage in actor MyMonitoredActor is 212
done handling message: SomeTriggerMessage
````

<br><br>
## **Wrapping up**

Stackable traits pattern is a good choice when you need to ‘pipe’ actions or modify and redirect data for an action. Mix and stack traits to describe the state of the class and execute the actions are clean and flexible, and generally the Scala-functional way to do it.

<img src="/img/scala_devs.png" alt="Scala developers meme">

------------------------------------------------------------------------------------------

*The complete source code can be found in my [github](https://github.com/FullGC/stackable-traits)*.
