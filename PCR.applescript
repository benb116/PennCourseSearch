set depts to paragraphs of (do shell script "ls /Users/Ben/Dropbox/Developer/PennCourseSearch/public/DeptListings/ | cut -d '.' -f 1")

repeat with dept in depts
	
	set courses to (do shell script "cat /Users/Ben/Desktop/DeptListings/" & dept & ".txt | cut -d '-' -f 1")
	do shell script "echo " & courses & " >  /Users/Ben/Desktop/DeptListings/" & dept & ".txt"
	
end repeat

repeat with x from 1 to count of depts
	set dept to item x of depts
	set courses to paragraphs of (do shell script "cat /Users/Ben/Desktop/DeptListings/" & dept & ".txt")
	
	repeat with course in courses
		log course
		set CID to (do shell script "curl http://localhost:3000/PCRSpitID?courseID=" & course)
		do shell script "echo " & course & " : " & CID & " >> /Users/Ben/Desktop/PCR-Rankings/" & dept & ".txt"
		delay 0.05
	end repeat
end repeat

repeat with x from 1 to count of depts
	set dept to item x of depts
	set courses to paragraphs of (do shell script "cat /Users/Ben/Desktop/PCR-Rankings2/" & dept & ".txt")
	
	repeat with course in courses
		log course
		set CID to do shell script "echo " & course & " | cut -d ':' -f 2 | cut -d ' ' -f 2"
		log CID
		if CID is not equal to "0000" then
			set rev to (do shell script "curl http://localhost:3000/PCRSpitRev?courseID=" & CID)
			do shell script "echo " & course & " : " & rev & " >> /Users/Ben/Desktop/PCR-Rankings2/" & dept & ".txt"
		end if
		delay 0.05
	end repeat
end repeat

repeat with x from 1 to count of depts
	set dept to item x of depts
	set courses to paragraphs of (do shell script "cat /Users/Ben/Dropbox/Developer/PennCourseSearch/public/DeptListings/" & dept & ".txt")
	
	repeat with course in courses
		set courseID to (do shell script "echo " & quoted form of course & "  | cut -d '>' -f 2 | cut -d '<' -f 1")
		log courseID
		try
			set courseLine to (do shell script "cat /Users/Ben/Desktop/PCR-Rankings2/" & dept & ".txt | grep ' " & (second word of courseID) & " :'")
			set PCR to (do shell script "echo " & courseLine & " | cut -d ':' -f 3 | cut -d ' ' -f 2")
		on error
			set PCR to "0.00"
		end try
		log courseLine
		set firstl to (characters 1 thru 9 of course) as string
		set secondl to (characters 10 thru -1 of course) as string
		set fullLine to firstl & PCR & secondl
		log fullLine
		do shell script "echo " & quoted form of fullLine & " >> /Users/Ben/Desktop/FinalDept/" & dept & ".txt"
		delay 0.1
	end repeat
end repeat