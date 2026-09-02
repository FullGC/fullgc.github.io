---
title:       "Stackable Traits pattern in Scala — Part 1"
part_title:  "Error-reporting design"
description: >-
  Scala's stackable traits pattern, built step by step into a layered error-reporting
  design, with the trait stack, linearisation order and runnable code.
permalink:   /stackable-traits-pattern/
date:        2018-07-23 14:20:45
series:      "Stackable Traits in Scala"
part:        1
tags:        [scala, stackable, traits]
image:       /img/burger-stack12.jpg
image_w:     1200
image_h:     378
---

*"Traits let you modify the methods of a class, and they do so in a way that allows you to stack those modifications with each other" (Programming in Scala by Martin Odersky)*

One of the reasons that Scala still feels to me like ‘a better Java’, is the power of its traits. A trait can be used for multiple inheritances, a Java interface, a rich interface with fields and a state, and a mix into a class.

An interesting behavior of traits, as opposed to classes, is the call for a super method. In classes this is statically bound, meaning that the exact implementation to be invoked is known upfront. In traits however, this is dynamically bound.
The term usually refers to an invocation of a method in an object, where the implementation is decided at runtime, i.e. a polymorphic call. The super call is not defined when a trait is defined, but only when it is mixed into a concrete class.
Such behavior allows us to ‘stack’ the traits, and use the super call as a ‘pipe’, redirecting output - similar to the ‘pipe’ in Linux. This is the basis for the use-cases we’ll review.

<br><br>
Consider the following:

An Ad-Server gets a request for an advertisement from a mobile phone.

We’ll discuss a solution for executing the actions that need to be taken when the Ad-Server encounters errors. There are two types of error which should be handled appropriately as follows:

On **FatalError**:

1. The Logger *prints* to the Log

2. The Monitor *increments* the counter Metric.

3. Kafka-Producer *sends* a Json Event with a timestamp  to Kafka.

4. *when step 3 failed*, S3-Client *uploads* the Event as CSV with a timestamp to to S3 (backup)

On **InvalidRequestError**

1. The Logger *prints* to the Log

2. The Monitor *increments* the counter Metric.

3. Kafka-Producer *sends* a Json Event to Kafka.

<img src="/img/stackable_narrative.png" alt="How stacked traits compose, layer by layer, over a base implementation">

An Error has a code, a description, and unique properties

````scala
trait ServingError{
 val code: Int
 val description: String
}
case class FatalError(override val code: Int = 1, exceptionCause: String) extends ServingError {
 override val description: String =  s"Fatal Error code $code accrued"
}
case class InvalidRequestError(paramName: String, paramValue: String, override val code: Int = 2) extends ServingError{
 override val description: String = s"Invalid Request. Bad  parameter: $paramName" + " " + s"with value: $paramValue"
}
````
And these are mocks for the Scala Clients

````scala
object KafkaProducer{
 def send(eventContent: String): Unit = println(s"sending to Kafka: $eventContent")
}
object Monitor{
 def incrementCounter(counterName: String, tags: (String, String)): Unit = println(s"incrementing counter $counterName")
}
object Logger{
 def log(event: String): Unit = println(s"error: $event")
}
object S3_Client {
 def upload(eventContent: String): Unit = println(s"uploading event $eventContent to S3")
}
````

<br><br>
## **Step-by-step implementation, using stackable-traits**


### Create traits that represent the subscribers and mix them.

We’ll create the following traits, each represents a subscriber for an error event

````scala
trait Log
trait Metric
trait S3_Backup
trait Kafka
````

And mix them with the 'Error' classes. Here, we use a Scala-type system to describe the 'Error' classes and the actions that need to be taken

````scala
trait ServingError{
 val code: Int
 val description: String
}
````

### Turn the traits into services that activates the Clients

Now it is clear which subscribers should receive a notification on error. We will enrich the traits, so they can activate the clients as well:

````scala
abstract class Sender {
 def send(event: ServingError): Unit
}
trait Log extends Sender {
 override def send(event: ServingError): Unit = {
   Logger.log(event.description)
 }
}
trait Metric extends Sender {
 override def send(event: ServingError): Unit = {
   Monitor.incrementCounter(event.getClass.getSimpleName/*this is not recommended...*/, "errorCode" ->
   event.code.toString)
 }
}
trait S3_Backup extends Sender {
 override def send(event: ServingError): Unit = {
   S3_Client.upload(event.content)
 }
}
trait Kafka extends Sender {
 def send(event: ServingError): Unit = {
   KafkaProducer.send(event.content) }
}
````

Alright, so now each trait has a “send” method that handles the event using the appropriate client.
But we still need to trigger it on the occurrence of an error, and call them in the order described above

### 'Stack' the services traits with each other

In other words, a pipe of calls for the ‘send’ method in the services. As discussed, we’ll need to use super method calls for that.
Note that in this step we won’t be stacking modifications, but the side-effects that triggered an error.

Now we need to stack the traits according to the order and logic defined in the narrative described above. The order of the invocation of the traits will be right to left.

Hence the order for FatalError: S3_Backup ← Kafka ← Monitor ← Log
Where S3_Backup should be invoked only when the Kafka-Producer failed to send the event to Kafka.

And for InvalidRequestError: Kafka ← Monitor ← Log

Let’s re-arranged the mix of the 'Error' classes:

````scala
case class FatalError(override val code: Int = 1, exceptionCause: String) extends ServingError with S3_Backup with Kafka with Monitor with Log{
 override val description: String = s"Fatal Error code $code accrued"
}
case class InvalidRequestError(paramName: String, paramValue: String, override val code: Int = 2) extends ServingError with Kafka with Monitoring with Log{
 override val description: String = s"Invalid Request. Bad  parameter: $paramName" + " " + s"with value: $paramValue"
}
case class FatalError(override val code: Int = 1, exceptionCause: String) extends ServingError with S3_Backup with Kafka with Monitor with Log{
 override val description: String = s"Fatal Error code $code accrued"
}
case class InvalidRequestError(paramName: String, paramValue: String, override val code: Int = 2) extends ServingError with Kafka with Monitoring with Log{
 override val description: String = s"Invalid Request. Bad  parameter: $paramName" + " " + s"with value: $paramValue"
}
````

And stack the traits:

````scala
trait Log extends Sender {
 abstract override def send(event: ServingError): Unit = {
   Logger.log(event.description)
   super.send(event)
 }
}
trait Metric extends Sender {
 abstract override def send(event: ServingError): Unit = {
   Monitor.incrementCounter(event.getClass.getSimpleName, "errorCode" -> event.code.toString)
   super.send(event)
 }
}
trait S3_Backup extends Sender {
 abstract override def send(event: ServingError): Unit = {
   S3_Client.upload(event.content)
   super.send(event)
 }
}
trait Kafka extends Sender {
 abstract override def send(event: ServingError): Unit = {
   Try(KafkaProducer.send(event.content)).getOrElse(super.send(event))
 }
}
````


You might notice that

1. The call ‘super.send(event)’ was added to ‘send’ method.

2. The ‘override’ modifier changed to ‘abstract override’, because the send method now overrides the behavior, but also calls for an abstract method with super.send. The modifier indicates that this trait must be mixed with a concrete class(later...).

   By the way, if we omit the ‘abstract’ from the modifier, we’ll get the following error:
   *“method send in class Sender is accessed from super. It may not be abstract unless it is overridden by a member declared 'abstract' and 'override' super.send(event)”*

3. Kafka would call super, i.e. S3-Backup would be invoked only when KafkaProducer fails to deliver.

### Create and 'Stack' modification traits:

<img src="/img/stack-traits.jpg" height = '300' alt="A stack of traits layered over a base class">

The event content needs modification to be in the right format (json, csv) before being sent as an input to KafkaProducer and S3. A fatal error needs to be sent with a timestamp.

Let’s write the modification method and the stackable modification traits:

````scala
object ServingError{
// we are adding a method modification content method, to be used by the modification traits
 def modifyContent(error: ServingError, content: String): ServingError = {
   error match {
     case f: FatalError => FatalError(exceptionCause = f.exceptionCause, content = content)
     case i: InvalidRequestError => InvalidRequestError(i.paramName, i.paramValue, content = content)
   }
 }
}

trait JsonTransformer extends Sender {
 import ServingError._
 abstract override def send(event: ServingError): Unit = {
   super.send(modifyContent(event, {
     val date = event match {
       case d: DateTimestampedMessage => "\"date\":" + d.date
       case _ => ""
     }
     val cause = event match {
       case f: FatalError => "\"cause\":" + f.exceptionCause
       case i: InvalidRequestError => "\"cause\":" + i.paramName +":" +i.paramValue
     }
     s"""
             {
                "code:"${event.code},
                $date
                $cause
             }
      """
   }))
 }
}
trait CsVTransformer extends Sender {
 import ServingError._
 abstract override def send(event: ServingError): Unit = {
   super.send(modifyContent(event, {
     val date = event match {
       case d: DateTimestampedMessage => d.date
       case _ => ""
     }
     val cause = event match {
       case f: FatalError => f.exceptionCause
       case i: InvalidRequestError => i.paramName +"," +i.paramValue
     }
     s"""${event.code},$date$cause"""
   }))
 }
}

trait Timestamp {
 val date: Date = new Date()
}
````

And mix the modification traits to the 'Error' classes

````scala
case class FatalError(override val code: Int = 1, exceptionCause: String, content: String = "") extends ServingError with S3_Backup with CsVTransformer with Kafka with JsonTransformer with Timestamp with Metric with Log{
 override val description: String = s"Fatal Error code $code accrued"
}
case class InvalidRequestError(paramName: String, paramValue: String, override val code: Int = 2, content: String = "") extends ServingError with Kafka with JsonTransformer with Log{
 override val description: String = s"Invalid Request. Bad  parameter: $paramName" + " " + s"with value: $paramValue"
}
````

### Create and mix 'ServingErrorSender' :

Last, to trigger error reports once an error object is created, we’ll mix them with a sending trait.

````scala
trait ServingErrorSender extends Sender{
 this: ServingError =>   // force to be mixed with a ServingError class, (look for 'see cake-pattern')
 def send(): Unit = send(this)
 override def send(event: ServingError): Unit = ""
}
````

````scala
trait ServingError extends ServingErrorSender{
 val code: Int
 val description: String
 val content: String
}
````

<br><br>
## **Try it out**

We have completed the task!

Now, when invoking a 'send'’ for an error, like the following:

````scala
FatalError(exceptionCause = new IllegalArgumentException().getClass.getSimpleName).send()
````

Results are with the following printed to the log:

````
error: Fatal Error code 1 accrued //Log
incrementing counter FatalError // Metric
sending to Kafka:  // Kafka
{
  "code:"1,
  "date":Thu Nov 30 16:56:33 IST 2017
  "cause":IllegalArgumentException
}
````

<br><br>
## **Next**

In [part-2]({{ '/stackable-traits-pattern---part-2/' | relative_url }}) we'll use stackable-actor traits for gathering actor’s metrics.

<br><br>
## **References**

*[Programming in Scala(chapter 12.5) / Martin Odersky and co](https://www.artima.com/shop/programming_in_scala_3ed)*

------------------------------------------------------------------------------------------

*The complete source code and more running examples can be found in my [github](https://github.com/FullGC/stackable-traits)*.
