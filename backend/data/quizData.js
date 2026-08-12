// backend/data/quizData.js
// Curated Question Banks for IQ, Software Engineering (by Year), and Japanese (by JLPT level)

const QUIZ_BANKS = {
  IQ: [
    {
      id: "iq_1",
      question: "Which number completes the logical sequence? 3, 7, 15, 31, 63, ?",
      options: ["125", "127", "128", "131"],
      correct: 1, // "127"
      explanation: "Each term is calculated by multiplying the previous term by 2 and adding 1 (Term * 2 + 1). 63 * 2 + 1 = 127."
    },
    {
      id: "iq_2",
      question: "If all Zips are Zaps, and some Zaps are Zops, which statement is DEFINITELY true?",
      options: [
        "All Zips are Zops",
        "Some Zips might be Zops",
        "No Zips are Zops",
        "All Zops are Zips"
      ],
      correct: 1,
      explanation: "Since all Zips are inside Zaps, and some Zaps overlap with Zops, it is possible (might be) that Zips overlap with Zops, but not guaranteed for all."
    },
    {
      id: "iq_3",
      question: "What is the time complexity of searching an item in a balanced Binary Search Tree (BST)?",
      options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
      correct: 1,
      explanation: "A balanced BST halves the search space at each node comparison, yielding logarithmic complexity O(log n)."
    },
    {
      id: "iq_4",
      question: "Which code snippet correctly checks if an integer 'x' is an even number in JavaScript?",
      options: ["x / 2 === 0", "x % 2 === 0", "x && 2 === 0", "Math.even(x)"],
      correct: 1,
      explanation: "The modulo operator (%) yields the remainder after division by 2. Even numbers have 0 remainder when divided by 2."
    }
  ],

  SE_YEAR_1_2: [
    {
      id: "se_y1_1",
      question: "In Object-Oriented Programming, which concept allows a class to inherit attributes and methods from another class?",
      options: ["Polymorphism", "Encapsulation", "Inheritance", "Abstraction"],
      correct: 2,
      explanation: "Inheritance allows a subclass to acquire properties and behavior from a parent superclass."
    },
    {
      id: "se_y1_2",
      question: "Which Git command is used to record repository changes locally with a descriptive message?",
      options: ["git push -m", "git commit -m 'message'", "git add .", "git save -m"],
      correct: 1,
      explanation: "git commit -m 'message' creates a new commit containing current staged changes with a descriptive message."
    },
    {
      id: "se_y1_3",
      question: "What does HTML stand for in web development?",
      options: [
        "HyperText Markup Language",
        "HighTech Machine Language",
        "Hyperlink Text Management Logic",
        "Home Tool Markup Language"
      ],
      correct: 0,
      explanation: "HTML stands for HyperText Markup Language, the standard formatting language for web document structures."
    },
    {
      id: "se_y1_4",
      question: "Which data structure follows a First-In, First-Out (FIFO) access order?",
      options: ["Stack", "Queue", "Tree", "Graph"],
      correct: 1,
      explanation: "A Queue operates on FIFO principles (First In, First Out), similar to a line of people waiting at a counter."
    }
  ],

  SE_YEAR_3_INTERN: [
    {
      id: "se_y3_1",
      question: "In RESTful API design, which HTTP method should be used to partially update an existing resource?",
      options: ["POST", "PUT", "PATCH", "GET"],
      correct: 2,
      explanation: "HTTP PATCH is designed for partial updates to a resource, while PUT typically replaces the entire resource entity."
    },
    {
      id: "se_y3_2",
      question: "What is the primary benefit of creating a Database Index on a frequently queried column?",
      options: [
        "Increases write/insert speed",
        "Drastically speeds up SELECT search queries",
        "Encrypts column data",
        "Reduces storage size"
      ],
      correct: 1,
      explanation: "Database indexes build B-Tree search structures to look up rows rapidly, avoiding expensive full-table scans during SELECT queries."
    },
    {
      id: "se_y3_3",
      question: "Which pattern is widely used in Node.js to manage asynchronous non-blocking operations?",
      options: ["Single-threaded Event Loop with Async/Await Promises", "Multi-threaded Synchronous Blocking Locks", "Process Forking Loop", "Static Queue Threads"],
      correct: 0,
      explanation: "Node.js relies on a single-threaded Event Loop backed by libuv threadpool to handle non-blocking asynchronous I/O efficiently."
    },
    {
      id: "se_y3_4",
      question: "What is the difference between SQL (Relational) and NoSQL (Document) databases?",
      options: [
        "SQL uses structured tables with schemas; NoSQL uses flexible JSON-like documents",
        "SQL does not support primary keys",
        "NoSQL cannot store numbers",
        "SQL databases cannot scale"
      ],
      correct: 0,
      explanation: "Relational SQL databases enforce structured tabular schemas with relational foreign keys, whereas NoSQL document stores (like MongoDB) hold flexible JSON documents."
    }
  ],

  SE_FINAL_YEAR_JOB: [
    {
      id: "se_y4_1",
      question: "In Microservice Architecture, what pattern is commonly used to prevent cascading network failures across services?",
      options: ["Circuit Breaker Pattern", "Singleton Pattern", "Factory Method Pattern", "Observer Pattern"],
      correct: 0,
      explanation: "The Circuit Breaker pattern monitors remote call failures and trips to stop invoking downstream services when they are unhealthy, preventing system-wide cascading downtime."
    },
    {
      id: "se_y4_2",
      question: "Which Docker component provides container orchestration, automated scaling, and zero-downtime rolling updates?",
      options: ["Docker Engine", "Kubernetes (K8s)", "Docker Compose", "Nginx"],
      correct: 1,
      explanation: "Kubernetes (K8s) automates deployment, scaling, health checking, load balancing, and rolling updates for containerized microservices."
    },
    {
      id: "se_y4_3",
      question: "What is the primary goal of Continuous Integration & Continuous Deployment (CI/CD) pipelines?",
      options: [
        "Automate code building, automated testing, and seamless deployment upon code push",
        "Replace developers with AI compilers",
        "Encrypt database backups",
        "Disable code reviews"
      ],
      correct: 0,
      explanation: "CI/CD pipelines automate testing, static code analysis, artifact building, and zero-downtime production deployment whenever commits pass pipeline checks."
    },
    {
      id: "se_y4_4",
      question: "In Cloud Architecture, what does horizontal scaling (Scale-Out) mean?",
      options: [
        "Upgrading CPU/RAM on a single server node",
        "Adding more server instances to distribute load across a load balancer",
        "Decreasing network bandwidth",
        "Moving data to cold tape storage"
      ],
      correct: 1,
      explanation: "Horizontal scaling (Scale-Out) provisions additional server instances in parallel behind a load balancer, providing elastic scalability."
    }
  ],

  JLPT_N5: [
    {
      id: "n5_1",
      question: "Which particle indicates the topic of a sentence in Japanese? (e.g. Watashi __ gakusei desu)",
      options: ["は (wa)", "を (o)", "に (ni)", "で (de)"],
      correct: 0,
      explanation: "The topic marker particle は (pronounced 'wa') marks the main subject/topic of the sentence."
    },
    {
      id: "n5_2",
      question: "What is the English meaning of the Japanese word 「ありがとう」(Arigatou)?",
      options: ["Good morning", "Thank you", "Goodbye", "Excuse me"],
      correct: 1,
      explanation: "「ありがとう」(Arigatou) means 'Thank you'."
    },
    {
      id: "n5_3",
      question: "Which Kanji character represents 'Water' (Mizu)?",
      options: ["日", "水", "木", "火"],
      correct: 1,
      explanation: "「水」(Mizu) is the Kanji character for water."
    }
  ],

  JLPT_N4: [
    {
      id: "n4_1",
      question: "Choose the correct particle for destination/goal: 「明日、東京__ 行きます。」(Tomorrow, I will go TO Tokyo)",
      options: ["へ (e / ni)", "を (o)", "で (de)", "が (ga)"],
      correct: 0,
      explanation: "The direction/destination particle へ (or に) marks the target location when moving (e.g. Tokyo e ikimasu)."
    },
    {
      id: "n4_2",
      question: "What does the Japanese expression 「お疲れ様です」(Otsukaresama desu) mean in workplace culture?",
      options: [
        "Thank you for your hard work / Good job today",
        "Where is the restroom?",
        "Happy birthday",
        "I am hungry"
      ],
      correct: 0,
      explanation: "「お疲れ様です」(Otsukaresama desu) is the fundamental workplace greeting acknowledging colleagues' efforts and hard work."
    },
    {
      id: "n4_3",
      question: "Which Kanji means 'Company / Firm' (Kaisha)?",
      options: ["会社", "学校", "病院", "電車"],
      correct: 0,
      explanation: "「会社」(Kaisha) means company / business organization."
    }
  ],

  JLPT_N3: [
    {
      id: "n3_1",
      question: "In Japanese Keigo (Honorific Speech), which phrase is used when offering something to a client or supervisor?",
      options: ["差し上げます (Sashiagemasu)", "もらいます", "たべます", "いきます"],
      correct: 0,
      explanation: "「差し上げます」(Sashiagemasu) is the humble honorific form of 'give/offer' used when addressing superiors or clients."
    },
    {
      id: "n3_2",
      question: "What is the Japanese term for 'Software Developer / Engineer'?",
      options: ["開発者 / エンジニア (Kaihatsusha / Enjinia)", "医者", "銀行員", "運転手"],
      correct: 0,
      explanation: "「開発者」(Kaihatsusha) means developer, and 「エンジニア」(Enjinia) means engineer."
    }
  ],

  JLPT_N2: [
    {
      id: "n2_1",
      question: "In IT project management in Japan, what does 「仕様書」(Shiyousho) refer to?",
      options: ["Software Requirement Specification Document", "Office receipt", "Flight ticket", "Weekly menu"],
      correct: 0,
      explanation: "「仕様書」(Shiyousho) refers to technical specification & requirements documents in software engineering."
    },
    {
      id: "n2_2",
      question: "Which Japanese business term means 'Prior Consultation / Stakeholder Consensus Building' before formal decisions?",
      options: ["根回し (Nemawashi)", "残業 (Zangyou)", "面接 (Mensetsu)", "朝礼 (Chourei)"],
      correct: 0,
      explanation: "「根回し」(Nemawashi) is the traditional Japanese corporate process of informally building consensus before a decision."
    }
  ]
};

module.exports = QUIZ_BANKS;
