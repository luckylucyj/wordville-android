/* Offline TOEIC conversation practice: original English dialogue prompts.
 * These are generated teaching prompts, NOT quotations from the source PDF
 * or certified examples from native speakers. Review uncommon/multiword items.
 */
(function(root){
'use strict';
const topics=['이디엄','채용·면접','규정·법률','사무 업무','사무 업무','사무 업무','여가·공동체','마케팅','글로벌 마케팅','경제','쇼핑','제품 개발','제조·생산','고객 서비스','출장·공항','계약·협상','상거래','배송·물류','숙박·식당','숙박·식당','회계','회사 소식','회의','사원 복지','인사이동','교통','은행','투자','건물·주택','환경','건강'];
const special={
'resume':[
['Did you get a chance to update your résumé?','Almost. I just need to add my latest job.'],
['Should I bring a printed résumé?','Yes, bring a couple of copies.'],
['Could you take a quick look at my résumé?','Of course. Send it over.'],
['Do you think my résumé is too long?','Two pages is fine if everything is relevant.'],
['Have you tailored your résumé for the role?','Not yet. I’ll do that tonight.'],
['Should I include my internship on my résumé?','Definitely. It’s relevant experience.'],
['Did the recruiter receive your résumé?','Yes, I got a confirmation email.'],
['Does this résumé look professional?','It does. I’d just fix the spacing.'],
['Can I list volunteer work on my résumé?','Sure, especially if it relates to the job.'],
['When are you sending your résumé?','I’m planning to submit it this afternoon.']
],
'opening':[
['Is there still an opening on your team?','Yes, we’re accepting applications.'],
['I heard there’s a job opening in accounting.','There is. Want me to send you the link?'],
['Do you have any openings this month?','We have two positions available.'],
['Who should I contact about the opening?','Try the hiring manager.'],
['Did they fill the opening already?','Not yet. Interviews start next week.'],
['Is that opening remote or on-site?','It’s mostly on-site.'],
['When was the opening posted?','Just yesterday.'],
['Are you interested in the opening?','Yes, the role looks like a good fit.'],
['Is the opening for a full-time position?','Yes, it’s a permanent role.'],
['Could you let me know about any new openings?','Absolutely. I’ll keep an eye out.']
],
'applicant':[
['How many applicants have we had so far?','About twenty since Monday.'],
['Is this applicant available for an interview?','Yes, Thursday afternoon works.'],
['Did the applicant submit a cover letter?','Yes, it’s attached to the résumé.'],
['What stood out about that applicant?','Their customer service experience.'],
['Should we contact the applicant today?','Yes, let’s follow up this morning.'],
['Has every applicant received a response?','Not yet. I’m working through the list.'],
['Does the applicant meet the requirements?','They meet most of them.'],
['Which applicant are we interviewing next?','The one with the design background.'],
['Can an applicant change the interview time?','Yes, just ask the recruiter.'],
['Did the applicant accept the offer?','Yes, they confirmed this morning.']
],
'reservation':[
['Do we need a reservation?','Yes, the restaurant fills up quickly.'],
['Can you check our reservation?','Sure. What name is it under?'],
['Did you make a reservation for tonight?','Yes, for two at seven.'],
['Could I change my reservation?','Of course. What time works better?'],
['Is the reservation confirmed?','Yes, I got a text message.'],
['What happens if we miss our reservation?','Call the restaurant as soon as you can.'],
['Did you cancel the reservation?','Not yet. I’ll do it now.'],
['Can we make a reservation online?','Yes, there’s a booking link.'],
['Whose name is the reservation under?','It’s under Kim.'],
['Do you have the reservation number?','Yes, it’s in my email.']
],
'invoice':[
['Could you send me the invoice?','Sure, I’ll email it this afternoon.'],
['Is the invoice due today?','No, payment is due next Friday.'],
['Did you check the invoice?','Yes, the total looks correct.'],
['Why is this invoice higher than usual?','There was an extra service charge.'],
['Can we pay the invoice online?','Yes, the payment details are at the bottom.'],
['Has the client received the invoice?','Yes, they confirmed this morning.'],
['Could you update the invoice address?','Absolutely. Send me the new details.'],
['Is there a mistake on the invoice?','I think the quantity is wrong.'],
['Who approves this invoice?','The finance manager does.'],
['Should I attach the invoice to the email?','Yes, please attach the PDF.']
],
'deadline':[
['When’s the deadline?','Friday at five.'],
['Can we extend the deadline?','I’ll ask the project manager.'],
['Did we miss the deadline?','No, we submitted it just in time.'],
['Is the deadline flexible?','Not for this project, unfortunately.'],
['Could you remind me about the deadline?','Sure, I’ll send you a message tomorrow.'],
['How close are we to the deadline?','We have two more days.'],
['Has the deadline changed?','Yes, it’s been moved to Monday.'],
['Can you finish this before the deadline?','I think so, if nothing else comes up.'],
['Who set the deadline?','The client did.'],
['What should we prioritize before the deadline?','Let’s finish the final review first.']
],
'refund':[
['Can I get a refund for this?','Yes, if you have the receipt.'],
['How long does a refund take?','Usually three to five business days.'],
['Did you request a refund?','Yes, I sent the form yesterday.'],
['Why was my refund declined?','The purchase was outside the return window.'],
['Can the refund go back to my card?','Yes, to the original payment method.'],
['Is this item eligible for a refund?','Let me check the store policy.'],
['Can you confirm the refund amount?','It’s the full purchase price.'],
['Have you received your refund yet?','Not yet, but it’s being processed.'],
['Do I need the original receipt for a refund?','A digital receipt is fine.'],
['Who can help me with my refund?','Customer support can look into it.']
],
'available':[
['Are you available tomorrow afternoon?','Yes, after two works for me.'],
['Is this table available?','Yes, you can sit here.'],
['Do you have any rooms available?','We have one left for tonight.'],
['Is that product still available?','Yes, we just got more in stock.'],
['When will the results be available?','They should be ready on Friday.'],
['Are tickets available online?','Yes, you can book them now.'],
['Is the meeting room available at ten?','It’s booked until eleven.'],
['Will the manager be available later?','She’ll be back after lunch.'],
['Do you have a smaller size available?','Let me check in the back.'],
['Is support available on weekends?','Yes, but the hours are shorter.']
]
};
const nounMass=new Set('information|equipment|maintenance|training|confidence|experience|research|feedback|advice|progress|staff|furniture|knowledge|traffic|access|support|work|employment|sales|security|privacy|technology|safety|quality|performance|growth|revenue|income|management|development|insurance|marketing|advertising|transportation|communication|education|evidence|competition|cooperation|assistance|funding|permission|patience|satisfaction|motivation|health|weather|pollution|electricity|supply|demand|approval'.split('|'));
const nounMarkers=/(ion|sion|ment|ness|ity|ence|ance|ship|hood|ism|age|ure|ing|ence|acy|tion|er|or|ist|ency|ology|ance|ence|tude|cy)$/i;
const adjMarkers=/(able|ible|ful|less|ous|ive|al|ic|ary|ent|ant|ed|ual)$/i;
const endingLyNouns=new Set('family|rally|monopoly|assembly|supply|ally|jelly|trolley'.split('|'));
const endingLyAdjectives=new Set('timely|costly|likely|friendly|lovely|lively|elderly|daily|weekly|monthly|quarterly|yearly|leisurely'.split('|'));
const endingLyVerbs=new Set('apply|reapply|comply|rely|supply|multiply'.split('|'));
const intransitive=new Set('arrive|leave|depart|remain|occur|happen|exist|appear|disappear|respond|travel|walk|run|come|go|rise|fall|grow|increase|decrease|decline|retire|resign|participate|wait|listen|stay|relax|succeed|fail|graduate|rely|depend|agree|disagree|proceed|continue|cooperate|communicate'.split('|'));
const adverbsIntensive=new Set('highly|very|really|extremely|particularly|fairly|remarkably|incredibly|relatively|surprisingly|significantly|substantially|quite|rather|especially|exceptionally|strongly|greatly|deeply'.split('|'));
const adverbsTime=new Set('recently|previously|currently|now|today|tomorrow|yesterday|soon|later|already|finally|eventually|occasionally|frequently|often|sometimes|rarely|regularly|annually|monthly|daily|weekly|immediately|shortly|temporarily|permanently'.split('|'));
const verbObjects={
'apply':'for the job','reapply':'for the position','supply':'the office with materials','multiply':'the number by two','qualify':'for the position','respond':'to the email','reply':'to the message','listen':'to the recording','refer':'to the document','contribute':'to the project','comply':'with the policy','depend':'on the schedule','rely':'on the team','participate':'in the meeting','invest':'in the company','arrive':'on time','depart':'on time','travel':'for work','wait':'for the manager','communicate':'with the client','cooperate':'with the team','agree':'with the proposal','disagree':'with the decision','proceed':'with the plan','resign':'from the position','retire':'next year','enroll':'in the program','register':'for the event','focus':'on the details','specialize':'in design','recover':'from the delay','graduate':'this spring','succeed':'in the new role','occur':'during the meeting','happen':'again','appear':'on the list','disappear':'from the screen','rise':'this quarter','fall':'next month','grow':'over time','decline':'over time','remain':'on the list','stay':'on schedule','extend':'the deadline','submit':'the application','complete':'the form','review':'the proposal','approve':'the request','confirm':'the booking','schedule':'the meeting','attend':'the training','cancel':'the booking','postpone':'the launch','negotiate':'the terms','check':'the figures','meet':'the deadline','hire':'the candidate','purchase':'the equipment','replace':'the part','order':'the supplies','ship':'the package','deliver':'the order','inspect':'the equipment','maintain':'the system','reduce':'the cost','increase':'the budget','prepare':'the presentation','promote':'the event','advertise':'the service','discuss':'the issue','explain':'the changes','inform':'the team','notify':'the client','provide':'the details','include':'the attachment','improve':'the process','request':'a refund','refund':'the charge','pay':'the invoice','remind':'the team','record':'the result','reschedule':'the interview','book':'a table','reserve':'a seat','organize':'the files'};
const pronunciationMap={'resume':'résumé'};
function wordType(w){
 const term=(w.word||'').trim().toLowerCase();
 const meaning=String(w.meaning||'').split(';')[0].trim();
 if(special[term])return 'curated';
 if(term.includes(' ')||term.includes("'"))return 'phrase';
 if(endingLyNouns.has(term)&&term!=='supply')return 'noun';
 if(endingLyAdjectives.has(term))return 'adjective';
 if(endingLyVerbs.has(term))return 'verb';
 if(adverbsIntensive.has(term))return 'intensive';
 if(adverbsTime.has(term))return 'time';
 if(term.endsWith('ly'))return 'adverb';
 if(/(하다|시키다|되다|~하다|붙이다|주다|나다|보다|얻다|찾다|받다)$/.test(meaning)||Object.hasOwn(verbObjects,term))return 'verb';
 if(/(한|있는|없는|적인|스러운|가능한|높은|낮은|않은|되는|되는 것|적격의|자격 있는)$/.test(meaning)||adjMarkers.test(term))return 'adjective';
 if(nounMarkers.test(term)||/(서|명|자|증|건|금|료|표|일|액|용|물|처|계|법|치|관|전|점)$/.test(meaning))return 'noun';
 return 'noun';
}
function cap(s){return s? s.charAt(0).toUpperCase()+s.slice(1):'';}
function make(a,b){return [a,b];}
function nounDialogs(t,mass){
 const n=mass?t:'the '+t;
 if(mass)return [
 make('Do we have enough '+t+'?','Let’s check before we make a decision.'),
 make('Is '+t+' important for this project?','Definitely. We shouldn’t overlook it.'),
 make('Can you tell me more about '+t+'?','Sure. What would you like to know?'),
 make('Have we made any progress with '+t+'?','Yes, but there’s still work to do.'),
 make('Who’s responsible for '+t+'?','I’ll check with the team lead.'),
 make('Should we focus on '+t+' first?','I think that makes sense.'),
 make('Has there been any change in '+t+'?','Not since the last update.'),
 make('How can we improve '+t+'?','Let’s start with the biggest issue.'),
 make('Can we talk about '+t+' after lunch?','Of course. I’m free at two.'),
 make('Is '+t+' part of the plan?','Yes, we’ve included it.')
 ];
 return [
 make('Have you checked '+n+' yet?','Yes, I looked at it this morning.'),
 make('Can you send me '+n+'?','Sure, I’ll send it over this afternoon.'),
 make('Are we still waiting for '+n+'?','Yes, but it should be ready soon.'),
 make('I have a question about '+n+'.','Of course. What would you like to know?'),
 make('Did anything change with '+n+'?','Not that I know of.'),
 make('Who’s handling '+n+'?','I think the operations team is.'),
 make('Should we discuss '+n+' now?','Let’s go over it after lunch.'),
 make('Is '+n+' included?','Yes, it’s on the list.'),
 make('Do we need to update '+n+'?','Probably. Let me take another look.'),
 make('When can I see '+n+'?','Tomorrow morning should work.')
 ];
}
function verbDialogs(t){
 const object=Object.hasOwn(verbObjects,t)?verbObjects[t]:(intransitive.has(t)?'':'it');
 const action=(t+' '+object).trim();
 const A=cap(action);
 return [
 make('Did you '+action+' yet?','Not yet. I’ll get to it this afternoon.'),
 make('Can you '+action+' before lunch?','I’ll do my best.'),
 make('Should I '+action+' now?','Yes, that would help.'),
 make('Are we supposed to '+action+' today?','That’s what the schedule says.'),
 make('What if we don’t '+action+'?','We may need to change our plans.'),
 make('I didn’t realize we had to '+action+'.','Neither did I until this morning.'),
 make('Have you had a chance to '+action+'?','Not yet, but it’s on my list.'),
 make('Let’s '+action+' before we leave.','Good idea. We’ll save time later.'),
 make('Will they '+action+' this week?','I think they’re planning to.'),
 make('Would it help to '+action+' first?','Yes, let’s start there.')
 ];
}
function adjDialogs(t){return [
 make('Does that sound '+t+' to you?','I think so, but let’s double-check.'),
 make('Is it really '+t+'?','That’s what I heard.'),
 make('Would you describe the situation as '+t+'?','Yes, considering what happened.'),
 make('Do you think this option is '+t+'?','It looks promising so far.'),
 make('Why is this so '+t+'?','There are a few reasons.'),
 make('That seems '+t+' to me.','I was thinking the same thing.'),
 make('Is it supposed to be '+t+'?','Let me check the guidelines.'),
 make('Was the result '+t+'?','More than we expected.'),
 make('Should the final version be '+t+'?','Yes, that’s part of the requirements.'),
 make('Could it be more '+t+'?','Possibly. We can make some adjustments.')
];}
function advDialogs(t,kind){
 if(kind==='intensive')return [
 make('Would you '+t+' recommend it?','Yes, I had a great experience.'),
 make('Is that '+t+' important?','Yes, especially for this project.'),
 make('Was the team '+t+' motivated?','They were. Everyone contributed.'),
 make('Are you '+t+' concerned about the delay?','A little, but we have a backup plan.'),
 make('Did that '+t+' affect the result?','It did, more than we expected.'),
 make('Is the role '+t+' competitive?','Yes, there are lots of applicants.'),
 make('Was the feedback '+t+' positive?','Mostly, yes.'),
 make('Is the report '+t+' detailed?','Yes, it covers all the main points.'),
 make('Would this be '+t+' useful?','I think it would.'),
 make('Are you '+t+' satisfied with it?','Yes, it turned out well.')
 ];
 if(kind==='time')return [
 make('Did you hear about it '+t+'?','Yes, a coworker mentioned it.'),
 make('Are they meeting '+t+'?','As far as I know, yes.'),
 make('Has anything changed '+t+'?','Just a few small details.'),
 make('Do we need to check again '+t+'?','That would be helpful.'),
 make('Were you working on it '+t+'?','Yes, I was finishing the report.'),
 make('Did they send an update '+t+'?','They did. I’ll forward it to you.'),
 make('Could we talk about it '+t+'?','Sure. Just let me know when.'),
 make('Has the price gone up '+t+'?','Not that I’ve noticed.'),
 make('Did the team discuss it '+t+'?','Yes, in the last meeting.'),
 make('Should I follow up '+t+'?','Yes, a quick message is fine.')
 ];
 return [
 make('Did they handle it '+t+'?','Yes, the whole process went smoothly.'),
 make('Could you explain it more '+t+'?','Sure. I’ll go through it step by step.'),
 make('Was the issue resolved '+t+'?','Yes, sooner than we expected.'),
 make('Did you look at the details '+t+'?','I did, and nothing seems missing.'),
 make('Can we do this '+t+'?','I think so. Let’s try.'),
 make('Did the team respond '+t+'?','Yes, they got back to us today.'),
 make('Are the results changing '+t+'?','A little, but not by much.'),
 make('Should we proceed '+t+'?','Let’s check one more thing first.'),
 make('Did you finish the task '+t+'?','Yes, it’s ready to review.'),
 make('Will it work '+t+' in practice?','We’ll know after the first test.')
 ];
}
function phraseDialogs(t){
 // Multiword expressions vary widely in grammar. Use learning-oriented
 // quotation conversations rather than inventing an ungrammatical construction.
 const q='“'+t+'”';
 return [
 make('I came across '+q+' in an email.','Could you show me the full sentence?'),
 make('Would '+q+' sound natural in a meeting?','It depends on the situation and tone.'),
 make('What does '+q+' mean in this context?','Let’s read the sentence around it.'),
 make('Could I use '+q+' when talking to a client?','Possibly, but make sure it fits the situation.'),
 make('I heard someone say '+q+' today.','Did you understand what they meant?'),
 make('Is '+q+' formal or informal?','That depends on how it’s being used.'),
 make('Would you say '+q+' in a work email?','I’d check the tone of the email first.'),
 make('Can we practice using '+q+'?','Sure. Let’s try a short role-play.'),
 make('Does '+q+' have more than one meaning?','It might. Context makes a difference.'),
 make('Should I memorize '+q+' as a whole phrase?','Yes, learning it in context often helps.')
 ];
}
function get(w,day){
 if(!w||typeof w.word!=='string')return [];
 const term=w.word.trim(),key=term.toLowerCase(),type=wordType(w);
 const data=(special[key] || (type==='verb'?verbDialogs(key):type==='adjective'?adjDialogs(key):type==='adverb'||type==='intensive'||type==='time'?advDialogs(key,type):type==='phrase'?phraseDialogs(term):nounDialogs(term,nounMass.has(key)))).slice(0,10);
 const dayNumber=Number(day);
 const topic=topics[dayNumber>=0&&dayNumber<=30?dayNumber:(w.days?.find(d=>d>0)||1)];
 return data.map((pair,i)=>({number:i+1,topic,type,english:'A: '+pair[0]+'\nB: '+pair[1]}));
}
root.WordvilleConversations={get,wordType,topics,specialCount:Object.keys(special).length};
})(typeof globalThis!=='undefined'?globalThis:this);
