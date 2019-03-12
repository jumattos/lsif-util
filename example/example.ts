interface Person {
    walk(): void;
}

class Student implements Person {
    walk(): void {
        console.log("Student walking...");
    }
}

class Teacher implements Person {
    walk(): void {
        console.log("Teacher walking...");
    }
} 

class SeniorTeacher extends Teacher {
    walk(): void {
        console.log("SeniorTeacher walking...");
    }
}