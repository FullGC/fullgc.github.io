<table>
<tbody>
<tr>
<td><b>Strategy</b><span style="font-weight: 400;"></span></td>
<td><b>When?</b><span style="font-weight: 400;"></span></td>
<td><b>Pros (when used as recommended</b><span style="font-weight: 400;">)</span></td>
<td><b>Cons (and misused implications)</b></td>
</tr>
<tr>
<td><b>Random</b></td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">No more than a few routees  or</span></li>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Lightweight tasks or low throughput</span></li>
</ul>
</td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">~Evenly distributed</span></li>
	<li style="font-weight: 400;"><span style="font-weight: 400;">No overhead</span></li>
</ul>
</td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Some mailboxes significantly more loaded than others*</span></li>
</ul>
</td>
</tr>
<tr>
<td><b><i>Round-Robin</i></b></td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">router handles similar tasks</span></li>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Lightweight tasks or low throughput</span></li>
</ul>
</td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">~Evenly distributed</span></li>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Minimal overhead</span></li>
</ul>
</td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Some mailboxes more loaded than others*</span></li>
</ul>
</td>
</tr>
<tr>
<td><b>Smallest-Mailbox</b></td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">router handles similar tasks</span></li>
	<li style="font-weight: 400;"><span style="font-weight: 400;">No more than hundreds of routees**</span></li>
</ul>
</td>
<td>
<ul>
</ul>
</td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Most evenly load of messages in mailboxes</span></li>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Significant overhead for a high number of routees</span></li>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Doesn’t hold with remote routees</span></li>
</ul>
</td>
</tr>
<tr>
<td><b>Broadcast</b></td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Task must be completed at least ones </span></li>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Limited number of routees on the same machine or lightweight tasks</span></li>
</ul>
</td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Fault tolerance</span></li>
</ul>
</td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Significant Machine’s cores overhead***</span></li>
</ul>
</td>
</tr>
<tr>
<td><b>Scatter-Gather-First</b></td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Latency is very important</span></li>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Using remote actors**</span></li>
</ul>
</td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Low latency</span></li>
</ul>
</td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Machine’s cores overhead</span></li>
</ul>
</td>
</tr>
<tr>
<td><b>Tail-Chopping</b></td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Tasks must be completed</span></li>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Latency is not very important</span></li>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Using remote actors</span></li>
</ul>
</td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Fault tolerance</span></li>
</ul>
</td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Machine’s cores overhead</span></li>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Fault recovery is slow</span></li>
</ul>
</td>
</tr>
<tr>
<td><b>Consistent-hashing</b></td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">Each routee is responsible for a specific part of a resource</span></li>
</ul>
</td>
<td></td>
<td></td>
</tr>
<tr>
<td><b>In-Code</b></td>
<td>
<ul>
	<li style="font-weight: 400;"><span style="font-weight: 400;">When nothing else suites</span></li>
</ul>
</td>
<td></td>
<td></td>
</tr>
</tbody>
</table>