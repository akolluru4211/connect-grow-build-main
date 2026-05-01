import jsPDF from "jspdf";
import { toast } from "sonner";

interface ProjectIdea {
  title: string;
  description: string;
  techStack: string[];
  difficulty: string;
  duration: string;
  skills: string[];
  implementationSteps: string[];
  realWorldUse: string;
  githubSearchQuery: string;
  youtubeSearchQuery: string;
  estimatedCost: string;
  uniqueSellingPoint: string;
}

const BLUE: [number, number, number] = [37, 99, 235];
const DARK: [number, number, number] = [30, 30, 30];
const GRAY: [number, number, number] = [80, 80, 80];
const LIGHT_GRAY: [number, number, number] = [140, 140, 140];
const WHITE: [number, number, number] = [255, 255, 255];
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const MAX_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = 285;

function addFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN, FOOTER_Y - 5, PAGE_W - MARGIN, FOOTER_Y - 5);
  doc.setFontSize(7);
  doc.setTextColor(...LIGHT_GRAY);
  doc.setFont("helvetica", "normal");
  doc.text("", MARGIN, FOOTER_Y);
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_W - MARGIN, FOOTER_Y, { align: "right" });
}

function checkPage(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > FOOTER_Y - 10) {
    doc.addPage();
    return 25;
  }
  return y;
}

function drawSectionHeader(doc: jsPDF, y: number, title: string, icon?: string): number {
  y = checkPage(doc, y, 20);
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(MARGIN, y - 5, MAX_W, 10, 2, 2, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text(`${icon ? icon + " " : ""}${title}`, MARGIN + 5, y + 2);
  return y + 14;
}

function drawSubHeader(doc: jsPDF, y: number, title: string): number {
  y = checkPage(doc, y, 15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLUE);
  doc.text(title, MARGIN, y);
  doc.setDrawColor(37, 99, 235);
  doc.line(MARGIN, y + 2, MARGIN + doc.getTextWidth(title), y + 2);
  return y + 8;
}

function drawParagraph(doc: jsPDF, y: number, text: string, fontSize = 10, color: [number, number, number] = GRAY): number {
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, MAX_W);
  for (const line of lines) {
    y = checkPage(doc, y, 6);
    doc.text(line, MARGIN, y);
    y += 5;
  }
  return y + 2;
}

function drawBulletList(doc: jsPDF, y: number, items: string[], fontSize = 10): number {
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  for (const item of items) {
    const lines = doc.splitTextToSize(item, MAX_W - 8);
    for (let k = 0; k < lines.length; k++) {
      y = checkPage(doc, y, 6);
      if (k === 0) {
        doc.setFillColor(37, 99, 235);
        doc.circle(MARGIN + 2, y - 1.5, 1.2, "F");
      }
      doc.text(lines[k], MARGIN + 8, y);
      y += 5;
    }
    y += 1;
  }
  return y + 2;
}

function drawNumberedList(doc: jsPDF, y: number, items: string[], fontSize = 10): number {
  doc.setFontSize(fontSize);
  for (let i = 0; i < items.length; i++) {
    const lines = doc.splitTextToSize(items[i], MAX_W - 12);
    for (let k = 0; k < lines.length; k++) {
      y = checkPage(doc, y, 7);
      if (k === 0) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BLUE);
        doc.text(`${i + 1}.`, MARGIN + 2, y);
      }
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY);
      doc.text(lines[k], MARGIN + 12, y);
      y += 5.5;
    }
    y += 2;
  }
  return y + 2;
}

function drawInfoBox(doc: jsPDF, y: number, label: string, value: string): number {
  y = checkPage(doc, y, 14);
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(MARGIN, y - 4, MAX_W, 12, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(label + ":", MARGIN + 4, y + 3);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(value, MARGIN + 4 + doc.getTextWidth(label + ": "), y + 3);
  return y + 15;
}

// ─── COVER PAGE ───
function buildCoverPage(doc: jsPDF, p: ProjectIdea): number {
  // Blue header band
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, PAGE_W, 100, "F");

  // White accent line
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, 85, PAGE_W - MARGIN, 85);

  // Title
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  const titleLines = doc.splitTextToSize(p.title, MAX_W - 10);
  let ty = 40;
  for (const line of titleLines) {
    doc.text(line, PAGE_W / 2, ty, { align: "center" });
    ty += 12;
  }

  // Subtitle
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Project Documentation", PAGE_W / 2, 78, { align: "center" });

  // Meta info
  let y = 115;
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.text("Difficulty:", MARGIN, y); doc.setFont("helvetica", "normal"); doc.text(p.difficulty, MARGIN + 30, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Duration:", MARGIN, y); doc.setFont("helvetica", "normal"); doc.text(p.duration, MARGIN + 30, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Cost:", MARGIN, y); doc.setFont("helvetica", "normal"); doc.text(p.estimatedCost || "N/A", MARGIN + 30, y);
  y += 8;
  if (p.uniqueSellingPoint) {
    doc.setFont("helvetica", "bold");
    doc.text("USP:", MARGIN, y); doc.setFont("helvetica", "normal");
    const uspLines = doc.splitTextToSize(p.uniqueSellingPoint, MAX_W - 30);
    doc.text(uspLines, MARGIN + 30, y);
    y += uspLines.length * 6;
  }

  // Description box
  y += 10;
  doc.setFillColor(245, 247, 250);
  const descLines = doc.splitTextToSize(p.description, MAX_W - 16);
  const boxH = descLines.length * 5 + 16;
  doc.roundedRect(MARGIN, y, MAX_W, boxH, 3, 3, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLUE);
  doc.text("Abstract", MARGIN + 8, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(descLines, MARGIN + 8, y + 16);

  // Footer area
  y = 260;
  doc.setFontSize(9);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text("", PAGE_W / 2, y, { align: "center" });
  doc.text("EdWorld", PAGE_W / 2, y + 6, { align: "center" });

  return 0; // cover page done
}

// ─── TABLE OF CONTENTS ───
function buildTOC(doc: jsPDF): number {
  doc.addPage();
  let y = 30;
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Table of Contents", PAGE_W / 2, y, { align: "center" });
  y += 15;
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1);
  doc.line(MARGIN + 30, y, PAGE_W - MARGIN - 30, y);
  y += 12;

  const chapters = [
    "1. Executive Summary",
    "2. Project Overview & Objectives",
    "3. Literature Review & Background",
    "4. System Requirements & Feasibility",
    "5. Technology Stack Analysis",
    "6. System Architecture & Design",
    "7. Database Design",
    "8. Implementation Roadmap",
    "9. Module-wise Implementation Details",
    "10. Testing Strategy",
    "11. Security Considerations",
    "12. Performance Optimization",
    "13. Deployment Strategy",
    "14. Real-World Applications",
    "15. Future Scope & Enhancements",
    "16. Skills & Learning Outcomes",
    "17. Team Roles & Responsibilities",
    "18. Budget & Cost Analysis",
    "19. Risk Assessment",
    "20. References & Resources",
    "21. Appendices",
  ];

  doc.setFontSize(11);
  for (const ch of chapters) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(ch, MARGIN + 10, y);
    y += 9;
  }
  return y;
}

// Generates detailed content for each chapter
function generateChapterContent(p: ProjectIdea): { title: string; icon: string; content: (doc: jsPDF, y: number) => number }[] {
  return [
    {
      title: "Executive Summary",
      icon: "📋",
      content: (doc, y) => {
        y = drawParagraph(doc, y, `This document presents a comprehensive project plan for "${p.title}". The project is designed at the ${p.difficulty} level with an estimated duration of ${p.duration}.`);
        y = drawParagraph(doc, y, p.description);
        y += 4;
        y = drawParagraph(doc, y, `The project leverages modern technologies including ${p.techStack.join(", ")} to deliver a robust, scalable solution. ${p.uniqueSellingPoint ? "Key differentiator: " + p.uniqueSellingPoint : ""}`);
        y += 4;
        y = drawSubHeader(doc, y, "Key Highlights");
        y = drawBulletList(doc, y, [
          `Technology Focus: ${p.techStack.slice(0, 3).join(", ")}`,
          `Difficulty Level: ${p.difficulty}`,
          `Estimated Timeline: ${p.duration}`,
          `Budget Estimate: ${p.estimatedCost || "Minimal"}`,
          `Primary Application: ${p.realWorldUse || "Multiple domains"}`,
        ]);
        return y;
      },
    },
    {
      title: "Project Overview & Objectives",
      icon: "🎯",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Project Vision");
        y = drawParagraph(doc, y, `"${p.title}" aims to address real-world challenges through innovative technology solutions. This project is conceived as a ${p.difficulty}-level endeavor that combines theoretical knowledge with practical implementation skills.`);
        y += 4;
        y = drawSubHeader(doc, y, "Primary Objectives");
        y = drawNumberedList(doc, y, [
          `Design and develop a complete working prototype of ${p.title} using ${p.techStack[0] || "modern technologies"}.`,
          "Implement core functionalities that solve the identified problem statement effectively.",
          "Apply software engineering principles including modular design, version control, and documentation.",
          "Conduct comprehensive testing to ensure reliability, performance, and user satisfaction.",
          `Demonstrate proficiency in ${p.skills.slice(0, 3).join(", ")} through hands-on implementation.`,
          "Create a deployable solution that can be showcased in portfolios and technical presentations.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Secondary Objectives");
        y = drawNumberedList(doc, y, [
          "Explore scalability patterns and performance optimization techniques.",
          "Implement security best practices appropriate for the application domain.",
          "Document the development process for knowledge transfer and future maintenance.",
          "Gain experience with collaborative development workflows and project management.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Scope of the Project");
        y = drawParagraph(doc, y, `The project scope encompasses the full software development lifecycle from requirements gathering through deployment. The solution will be built using ${p.techStack.join(", ")} and will target ${p.realWorldUse || "practical applications"}.`);
        y = drawBulletList(doc, y, [
          "Requirements analysis and feasibility study",
          "System design and architecture planning",
          "Frontend and backend development",
          "Database design and implementation",
          "Testing and quality assurance",
          "Deployment and documentation",
        ]);
        return y;
      },
    },
    {
      title: "Literature Review & Background",
      icon: "📚",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Domain Background");
        y = drawParagraph(doc, y, `The domain of ${p.title} has seen significant growth and innovation in recent years. Understanding the existing landscape is crucial for positioning this project effectively and identifying areas where it can contribute meaningfully.`);
        y += 4;
        y = drawSubHeader(doc, y, "Existing Solutions Analysis");
        y = drawParagraph(doc, y, "Several existing solutions address similar problems in this domain. The following analysis highlights their strengths and limitations:");
        y = drawBulletList(doc, y, [
          "Commercial solutions: Often feature-rich but expensive and closed-source, limiting customization for specific use cases.",
          "Open-source alternatives: Provide flexibility but may lack polish, documentation, or active maintenance.",
          "Academic prototypes: Demonstrate novel approaches but rarely reach production-ready quality.",
          "Industry tools: Focused on enterprise needs, often overengineered for smaller-scale applications.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Technology Landscape");
        y = drawParagraph(doc, y, `The technology stack chosen for this project (${p.techStack.join(", ")}) represents the current industry standards and best practices. Each technology was selected based on the following criteria:`);
        for (const tech of p.techStack) {
          y = drawParagraph(doc, y, `• ${tech}: Widely adopted in the industry with strong community support, extensive documentation, and proven reliability in production environments. It offers excellent developer experience and integrates well with other components in the stack.`);
        }
        y += 4;
        y = drawSubHeader(doc, y, "Gap Analysis");
        y = drawParagraph(doc, y, `This project fills a critical gap by providing ${p.uniqueSellingPoint || "an accessible, well-documented solution that balances functionality with simplicity"}. Unlike existing solutions, it focuses on practical applicability while maintaining code quality and extensibility.`);
        y = drawSubHeader(doc, y, "Research References");
        y = drawParagraph(doc, y, `For further exploration, search GitHub for: "${p.githubSearchQuery || p.title}" and YouTube for: "${p.youtubeSearchQuery || p.title + " tutorial"}" to find related repositories and video tutorials.`);
        return y;
      },
    },
    {
      title: "System Requirements & Feasibility",
      icon: "⚙️",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Functional Requirements");
        y = drawNumberedList(doc, y, [
          "User Registration and Authentication: Secure signup/login with email verification and session management.",
          "Core Feature Module: Primary functionality implementing the main use case of the application.",
          "Data Management: CRUD operations for all entities with proper validation and error handling.",
          "Search and Filtering: Efficient data retrieval with multiple filter criteria and sorting options.",
          "Reporting and Analytics: Dashboard with key metrics, data visualization, and export capabilities.",
          "User Profile Management: Customizable profiles with preferences and activity history.",
          "Notification System: Real-time alerts for important events and updates.",
          "Admin Panel: Administrative interface for system management and monitoring.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Non-Functional Requirements");
        y = drawBulletList(doc, y, [
          "Performance: Response time < 2 seconds for 95% of requests; support 100+ concurrent users.",
          "Scalability: Horizontal scaling capability with stateless architecture.",
          "Security: OWASP top 10 compliance, encrypted data transmission, secure authentication.",
          "Availability: 99.5% uptime target with graceful error handling and fallback mechanisms.",
          "Usability: Mobile-responsive design, WCAG 2.1 AA accessibility compliance.",
          "Maintainability: Clean code architecture, comprehensive documentation, automated testing.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Hardware Requirements");
        y = drawBulletList(doc, y, [
          "Development: Modern computer with 8GB+ RAM, SSD storage, stable internet connection.",
          "Server (Cloud): 2 vCPU, 4GB RAM minimum; recommended cloud providers: AWS, GCP, or Vercel.",
          "Client: Modern web browser (Chrome 90+, Firefox 88+, Safari 14+), stable internet connection.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Software Requirements");
        y = drawBulletList(doc, y, [
          `Primary Stack: ${p.techStack.join(", ")}`,
          "Version Control: Git with GitHub/GitLab for repository hosting.",
          "IDE: VS Code with relevant extensions for the tech stack.",
          "Package Manager: npm/yarn for dependency management.",
          "Testing: Jest/Vitest for unit tests, Cypress/Playwright for E2E tests.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Feasibility Analysis");
        y = drawParagraph(doc, y, "Technical Feasibility: All chosen technologies are mature, well-documented, and have been successfully used in similar projects. The team possesses or can acquire the necessary skills within the project timeline.");
        y = drawParagraph(doc, y, `Economic Feasibility: Estimated project cost is ${p.estimatedCost || "minimal"}, primarily involving cloud hosting and development tools, most of which have free tiers.`);
        y = drawParagraph(doc, y, `Operational Feasibility: The ${p.duration} timeline is realistic given the scope. The project can be completed by a focused team with ${p.difficulty === "Beginner" ? "basic" : p.difficulty === "Advanced" ? "advanced" : "intermediate"} technical skills.`);
        return y;
      },
    },
    {
      title: "Technology Stack Analysis",
      icon: "🛠️",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Stack Overview");
        y = drawParagraph(doc, y, `The technology stack for "${p.title}" has been carefully selected to balance development speed, performance, scalability, and developer experience.`);
        y += 4;
        for (const tech of p.techStack) {
          y = drawSubHeader(doc, y, tech);
          y = drawParagraph(doc, y, `${tech} is a critical component of this project's architecture. It was chosen for its strong ecosystem, active community, and proven track record in production applications.`);
          y = drawBulletList(doc, y, [
            `Role in Project: Core technology enabling key functionality and integration with other stack components.`,
            `Advantages: Mature ecosystem, excellent documentation, strong community support, performance optimized.`,
            `Alternatives Considered: Other options were evaluated but ${tech} was selected for its superior fit with project requirements.`,
            `Version: Latest stable version recommended for security patches and feature improvements.`,
          ]);
          y += 3;
        }
        y += 4;
        y = drawSubHeader(doc, y, "Technology Comparison Matrix");
        y = drawParagraph(doc, y, "The chosen stack was evaluated against alternatives across multiple dimensions: learning curve, performance, community size, enterprise adoption, and documentation quality. The selected combination scored highest overall.");
        y += 4;
        y = drawSubHeader(doc, y, "Integration Architecture");
        y = drawParagraph(doc, y, "All technologies in the stack integrate seamlessly through well-defined APIs and industry-standard protocols (REST/GraphQL for API communication, JSON for data interchange, JWT for authentication tokens).");
        return y;
      },
    },
    {
      title: "System Architecture & Design",
      icon: "🏗️",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "High-Level Architecture");
        y = drawParagraph(doc, y, "The system follows a modern layered architecture pattern that separates concerns and enables independent scaling of components.");
        y += 4;
        y = drawParagraph(doc, y, "Architecture Layers:");
        y = drawNumberedList(doc, y, [
          "Presentation Layer: User interface built with responsive design principles, handling user interactions and displaying data.",
          "Application Layer: Business logic implementation, request validation, data transformation, and workflow orchestration.",
          "Service Layer: Reusable services for authentication, notifications, file handling, caching, and third-party integrations.",
          "Data Access Layer: Database queries, ORM integration, connection pooling, and data caching strategies.",
          "Infrastructure Layer: Cloud services, deployment pipelines, monitoring, logging, and error tracking.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Design Patterns Used");
        y = drawBulletList(doc, y, [
          "MVC/MVVM: Separation of data models, views, and controllers/view-models for clean code organization.",
          "Repository Pattern: Abstraction layer over data access, enabling easy switching of data sources.",
          "Observer Pattern: Event-driven communication between components for real-time updates.",
          "Singleton Pattern: Single instances for database connections, configuration managers, and logging services.",
          "Factory Pattern: Dynamic creation of objects based on runtime conditions and configuration.",
          "Strategy Pattern: Interchangeable algorithms for features like search, sorting, and data processing.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Component Diagram");
        y = drawParagraph(doc, y, "The system comprises the following major components:");
        y = drawBulletList(doc, y, [
          "Auth Module: User registration, login, password recovery, session management, and role-based access control.",
          "Core Module: Primary business logic implementing the main features and workflows.",
          "API Gateway: Request routing, rate limiting, authentication middleware, and response formatting.",
          "Database: Data persistence with proper indexing, migrations, and backup strategies.",
          "File Storage: Media uploads, document management with CDN integration for fast delivery.",
          "Notification Service: Email, push, and in-app notifications with template management.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Data Flow Diagram");
        y = drawParagraph(doc, y, "Data flows through the system in a predictable manner: User Input → Validation → Business Logic → Data Storage → Response Formatting → User Interface. Each layer processes and transforms data before passing it to the next, ensuring data integrity and security at every step.");
        return y;
      },
    },
    {
      title: "Database Design",
      icon: "🗄️",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Database Selection");
        y = drawParagraph(doc, y, "The database system was selected based on the data model requirements, query patterns, scalability needs, and cost considerations. Both SQL and NoSQL options were evaluated.");
        y += 4;
        y = drawSubHeader(doc, y, "Entity-Relationship Model");
        y = drawParagraph(doc, y, "The database schema includes the following primary entities:");
        y = drawBulletList(doc, y, [
          "Users: id (PK), email, password_hash, full_name, avatar_url, role, created_at, updated_at",
          "Profiles: id (PK), user_id (FK), bio, skills[], location, social_links, preferences",
          "Content/Items: id (PK), title, description, metadata, status, created_by (FK), timestamps",
          "Interactions: id (PK), user_id (FK), target_id (FK), type, payload, created_at",
          "Notifications: id (PK), user_id (FK), type, title, message, is_read, link, created_at",
          "Settings: id (PK), user_id (FK), key, value, updated_at",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Normalization");
        y = drawParagraph(doc, y, "The database is normalized to Third Normal Form (3NF) to minimize data redundancy while maintaining query performance. Strategic denormalization is applied for frequently accessed read patterns.");
        y += 4;
        y = drawSubHeader(doc, y, "Indexing Strategy");
        y = drawBulletList(doc, y, [
          "Primary keys on all tables for unique identification.",
          "Foreign key indexes for join performance optimization.",
          "Composite indexes on frequently filtered column combinations.",
          "Full-text search indexes on searchable content fields.",
          "Partial indexes for status-based queries (e.g., active records only).",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Data Security");
        y = drawParagraph(doc, y, "Row-Level Security (RLS) policies ensure users can only access their own data. Sensitive fields are encrypted at rest. All database connections use SSL/TLS encryption.");
        return y;
      },
    },
    {
      title: "Implementation Roadmap",
      icon: "🗺️",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Phase-wise Implementation");
        y = drawParagraph(doc, y, `The implementation is structured across the ${p.duration} timeline with clear milestones and deliverables for each phase.`);
        y += 4;

        const phases = [
          { name: "Phase 1: Planning & Setup (Week 1-2)", tasks: ["Requirements finalization and documentation", "Development environment setup and tooling configuration", "Repository initialization with CI/CD pipeline", "UI/UX wireframes and prototype design", "Database schema design and initial migration"] },
          { name: "Phase 2: Core Development (Week 3-6)", tasks: ["Authentication and authorization system", "Core feature modules development", "API endpoint implementation and testing", "Database integration and data layer", "Frontend component development"] },
          { name: "Phase 3: Advanced Features (Week 7-9)", tasks: ["Search, filtering, and sorting features", "File upload and media management", "Notification system implementation", "Admin dashboard and analytics", "Performance optimization"] },
          { name: "Phase 4: Testing & Polish (Week 10-11)", tasks: ["Unit and integration testing", "End-to-end testing with test automation", "UI/UX refinement and responsive design fixes", "Security audit and vulnerability patching", "Documentation updates"] },
          { name: "Phase 5: Deployment & Launch (Week 12)", tasks: ["Production deployment and configuration", "Performance monitoring setup", "User acceptance testing", "Final documentation and knowledge transfer", "Project presentation preparation"] },
        ];

        for (const phase of phases) {
          y = drawSubHeader(doc, y, phase.name);
          y = drawBulletList(doc, y, phase.tasks);
          y += 3;
        }

        if (p.implementationSteps?.length > 0) {
          y += 4;
          y = drawSubHeader(doc, y, "AI-Suggested Implementation Steps");
          y = drawNumberedList(doc, y, p.implementationSteps);
        }
        return y;
      },
    },
    {
      title: "Module-wise Implementation Details",
      icon: "📦",
      content: (doc, y) => {
        const modules = [
          { name: "Authentication Module", desc: "Handles user registration, login, logout, password reset, and session management. Implements JWT-based authentication with refresh token rotation. Supports social login integration (Google, GitHub). Includes rate limiting on auth endpoints to prevent brute force attacks.", features: ["Email/password registration with validation", "Secure login with bcrypt password hashing", "JWT access & refresh token management", "Password reset via email link", "Account verification flow", "Social OAuth integration"] },
          { name: "User Profile Module", desc: "Manages user profiles including personal information, preferences, avatar uploads, and activity tracking. Provides public profile views and privacy settings.", features: ["Profile creation and editing", "Avatar/image upload with compression", "Privacy settings and visibility controls", "Activity feed and history", "Skill and interest tagging"] },
          { name: "Core Feature Module", desc: `The primary module that implements the main functionality of "${p.title}". This module contains the business logic that differentiates this project.`, features: ["Main CRUD operations for core entities", "Business rule validation and enforcement", "Data transformation and processing pipelines", "Real-time updates via WebSocket/SSE", "Caching strategy for frequent queries"] },
          { name: "Search & Discovery Module", desc: "Provides full-text search, filtering, sorting, and recommendation capabilities across all content types.", features: ["Full-text search with relevance scoring", "Multi-criteria filtering and faceted search", "Sort by relevance, date, popularity", "Auto-complete and search suggestions", "Search analytics and trending queries"] },
          { name: "Notification Module", desc: "Handles all notification channels including in-app, email, and push notifications with preference management.", features: ["In-app notification center", "Email notification with templates", "Push notification support", "Notification preferences per user", "Batch notification processing"] },
          { name: "Admin & Analytics Module", desc: "Administrative dashboard for system management, user oversight, content moderation, and analytics.", features: ["User management and role assignment", "Content moderation tools", "System health monitoring dashboard", "Analytics and reporting with charts", "Configuration management"] },
        ];

        for (const mod of modules) {
          y = drawSubHeader(doc, y, mod.name);
          y = drawParagraph(doc, y, mod.desc);
          y = drawParagraph(doc, y, "Key Features:");
          y = drawBulletList(doc, y, mod.features);
          y += 4;
        }
        return y;
      },
    },
    {
      title: "Testing Strategy",
      icon: "🧪",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Testing Approach");
        y = drawParagraph(doc, y, "A comprehensive testing strategy ensures quality, reliability, and maintainability across the entire application.");
        y += 4;
        y = drawSubHeader(doc, y, "Unit Testing");
        y = drawParagraph(doc, y, "Individual functions and components are tested in isolation. Target: 80%+ code coverage for critical business logic modules.");
        y = drawBulletList(doc, y, ["Framework: Jest/Vitest for JavaScript/TypeScript", "Mocking: External dependencies and API calls are mocked", "Coverage: Automated reports generated on each CI/CD run", "Naming: Descriptive test names following 'should...when...' pattern"]);
        y += 4;
        y = drawSubHeader(doc, y, "Integration Testing");
        y = drawParagraph(doc, y, "Tests verify correct interaction between modules, API endpoints, and database operations.");
        y = drawBulletList(doc, y, ["API endpoint testing with supertest/Postman", "Database integration with test fixtures", "Authentication flow verification", "File upload and processing pipeline tests"]);
        y += 4;
        y = drawSubHeader(doc, y, "End-to-End Testing");
        y = drawParagraph(doc, y, "Full user journey tests simulate real user interactions across the complete application stack.");
        y = drawBulletList(doc, y, ["Framework: Cypress or Playwright for browser automation", "Critical path testing: Registration → Login → Core Features → Logout", "Cross-browser testing on Chrome, Firefox, Safari", "Mobile responsive testing on multiple viewport sizes"]);
        y += 4;
        y = drawSubHeader(doc, y, "Performance Testing");
        y = drawBulletList(doc, y, ["Load testing with k6 or Artillery for concurrent user simulation", "Lighthouse audits for frontend performance metrics", "Database query performance profiling", "API response time benchmarking under load"]);
        y += 4;
        y = drawSubHeader(doc, y, "Security Testing");
        y = drawBulletList(doc, y, ["OWASP ZAP for automated vulnerability scanning", "SQL injection and XSS prevention verification", "Authentication bypass attempt testing", "Rate limiting and brute force protection validation"]);
        return y;
      },
    },
    {
      title: "Security Considerations",
      icon: "🔒",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Authentication Security");
        y = drawBulletList(doc, y, [
          "Password hashing with bcrypt (cost factor 12+) to prevent rainbow table attacks.",
          "JWT tokens with short expiration (15 min access, 7 day refresh) and secure rotation.",
          "Multi-factor authentication (MFA) support for enhanced account security.",
          "Account lockout after 5 failed login attempts with exponential backoff.",
          "Session invalidation on password change or suspicious activity detection.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Data Protection");
        y = drawBulletList(doc, y, [
          "All data transmitted over HTTPS/TLS 1.3 encryption.",
          "Sensitive data encrypted at rest using AES-256.",
          "Row-Level Security (RLS) ensuring data isolation between users.",
          "Input sanitization and parameterized queries to prevent SQL injection.",
          "Content Security Policy (CSP) headers to prevent XSS attacks.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "API Security");
        y = drawBulletList(doc, y, [
          "Rate limiting: 100 requests/minute per IP for public endpoints, 1000 for authenticated.",
          "CORS configuration restricting origins to known domains.",
          "Request size limits to prevent denial-of-service via large payloads.",
          "API key rotation policy with automated key management.",
          "Webhook signature verification for third-party integrations.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "OWASP Top 10 Compliance");
        y = drawParagraph(doc, y, "The application is designed to address all OWASP Top 10 security risks including injection flaws, broken authentication, sensitive data exposure, XML external entities (XXE), broken access control, security misconfiguration, cross-site scripting (XSS), insecure deserialization, using components with known vulnerabilities, and insufficient logging/monitoring.");
        return y;
      },
    },
    {
      title: "Performance Optimization",
      icon: "⚡",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Frontend Optimization");
        y = drawBulletList(doc, y, [
          "Code splitting and lazy loading for reduced initial bundle size.",
          "Image optimization with WebP format and responsive srcset.",
          "Service Worker caching for offline capability and faster repeat visits.",
          "Virtual scrolling for large lists to maintain smooth 60fps rendering.",
          "Debounced search inputs and optimistic UI updates for perceived speed.",
          "Tree-shaking unused code and minification for production builds.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Backend Optimization");
        y = drawBulletList(doc, y, [
          "Database query optimization with EXPLAIN ANALYZE profiling.",
          "Connection pooling for efficient database resource utilization.",
          "Redis/in-memory caching for frequently accessed data (TTL-based).",
          "Pagination and cursor-based loading for large datasets.",
          "Background job queues for long-running operations (email, file processing).",
          "CDN integration for static assets and media files.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Performance Targets");
        y = drawBulletList(doc, y, [
          "First Contentful Paint (FCP): < 1.5 seconds",
          "Largest Contentful Paint (LCP): < 2.5 seconds",
          "Time to Interactive (TTI): < 3.5 seconds",
          "Cumulative Layout Shift (CLS): < 0.1",
          "Lighthouse Performance Score: > 90",
          "API Response Time (p95): < 200ms",
        ]);
        return y;
      },
    },
    {
      title: "Deployment Strategy",
      icon: "🚀",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Deployment Architecture");
        y = drawParagraph(doc, y, "The application uses a modern cloud-native deployment strategy with CI/CD automation for reliable and repeatable releases.");
        y += 4;
        y = drawSubHeader(doc, y, "CI/CD Pipeline");
        y = drawNumberedList(doc, y, [
          "Code Push: Developer pushes code to GitHub repository (feature branch).",
          "Automated Tests: CI pipeline runs linting, unit tests, and type checking.",
          "Build: Production build is created with optimizations and minification.",
          "Preview Deployment: Automatic preview deployment for pull request review.",
          "Review & Merge: Code review, approval, and merge to main branch.",
          "Production Deploy: Automatic deployment to production on merge.",
          "Health Check: Post-deployment health checks verify system stability.",
          "Rollback: Automatic rollback if health checks fail within 5 minutes.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Environment Configuration");
        y = drawBulletList(doc, y, [
          "Development: Local environment with hot reload, debug logging, and mock services.",
          "Staging: Mirror of production with test data for pre-release validation.",
          "Production: Optimized build with monitoring, alerting, and error tracking.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Monitoring & Logging");
        y = drawBulletList(doc, y, [
          "Application performance monitoring (APM) with error tracking.",
          "Structured logging with correlation IDs for request tracing.",
          "Real-time dashboards for system health and business metrics.",
          "Alerting rules for error rate spikes, latency degradation, and resource exhaustion.",
        ]);
        return y;
      },
    },
    {
      title: "Real-World Applications",
      icon: "🌍",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Primary Use Case");
        y = drawParagraph(doc, y, p.realWorldUse || `"${p.title}" addresses practical challenges in its target domain, providing value to end users and stakeholders.`);
        y += 4;
        y = drawSubHeader(doc, y, "Industry Applications");
        y = drawBulletList(doc, y, [
          "Education: Enhancing learning outcomes through technology-driven solutions and interactive platforms.",
          "Healthcare: Improving data management, patient tracking, and medical record accessibility.",
          "E-commerce: Streamlining online transactions, inventory management, and customer experience.",
          "Finance: Automating financial workflows, reporting, and compliance tracking.",
          "Social Impact: Creating tools for community engagement, resource sharing, and social good.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Scalability Potential");
        y = drawParagraph(doc, y, "The architecture supports scaling from a single-user prototype to a multi-tenant SaaS platform. Key scalability vectors include horizontal scaling of compute resources, database sharding for data growth, and CDN distribution for global reach.");
        y += 4;
        y = drawSubHeader(doc, y, "Monetization Opportunities");
        y = drawBulletList(doc, y, [
          "Freemium model with premium features for power users.",
          "API access tiers for developer integrations.",
          "White-label licensing for enterprise customers.",
          "Data analytics and insights as a value-added service.",
        ]);
        return y;
      },
    },
    {
      title: "Future Scope & Enhancements",
      icon: "🔮",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Short-term Enhancements (1-3 months)");
        y = drawBulletList(doc, y, [
          "Mobile application development (React Native / Flutter) for iOS and Android platforms.",
          "Advanced analytics dashboard with custom report generation and data export.",
          "Integration with third-party services (payment gateways, social media, cloud storage).",
          "Internationalization (i18n) and localization for multi-language support.",
          "Accessibility improvements to meet WCAG 2.1 AAA standards.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Medium-term Enhancements (3-6 months)");
        y = drawBulletList(doc, y, [
          "AI/ML integration for personalized recommendations and intelligent automation.",
          "Real-time collaboration features with WebSocket-based live editing.",
          "Advanced search with NLP-powered natural language queries.",
          "Workflow automation with customizable triggers and actions.",
          "Plugin/extension system for community-contributed functionality.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Long-term Vision (6-12 months)");
        y = drawBulletList(doc, y, [
          "Microservices architecture migration for independent service scaling.",
          "Machine learning pipeline for predictive analytics and trend forecasting.",
          "Multi-tenant SaaS platform with isolated data and custom branding.",
          "Blockchain integration for audit trails and data integrity verification.",
          "IoT device integration for real-time sensor data processing.",
        ]);
        return y;
      },
    },
    {
      title: "Skills & Learning Outcomes",
      icon: "🎓",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Technical Skills Acquired");
        y = drawBulletList(doc, y, p.skills.map(s => `${s}: Hands-on experience through practical implementation, debugging, and optimization in a real project context.`));
        y += 4;
        y = drawSubHeader(doc, y, "Soft Skills Developed");
        y = drawBulletList(doc, y, [
          "Problem Solving: Decomposing complex requirements into implementable solutions.",
          "Technical Communication: Writing clear documentation and presenting technical concepts.",
          "Project Management: Planning, estimating, tracking progress, and adapting to changes.",
          "Collaboration: Working with version control, code reviews, and team communication.",
          "Critical Thinking: Evaluating trade-offs in design decisions and technology choices.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Portfolio Value");
        y = drawParagraph(doc, y, "This project serves as a strong portfolio piece demonstrating full-stack development capabilities, system design thinking, and the ability to deliver production-quality software. It can be showcased on GitHub, personal websites, and during job interviews.");
        return y;
      },
    },
    {
      title: "Team Roles & Responsibilities",
      icon: "👥",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Recommended Team Structure");
        const roles = [
          { role: "Project Lead / Full Stack Developer", resp: "Overall project coordination, architecture decisions, code reviews, backend API development, and deployment management." },
          { role: "Frontend Developer", resp: "UI/UX implementation, responsive design, state management, component development, and frontend testing." },
          { role: "Backend Developer", resp: "API development, database design, authentication system, server-side logic, and performance optimization." },
          { role: "QA / Testing Engineer", resp: "Test strategy, test case development, automation scripts, bug tracking, and quality metrics reporting." },
        ];
        for (const r of roles) {
          y = drawSubHeader(doc, y, r.role);
          y = drawParagraph(doc, y, r.resp);
          y += 2;
        }
        y += 4;
        y = drawSubHeader(doc, y, "Communication Plan");
        y = drawBulletList(doc, y, [
          "Daily standup meetings (15 min) to sync progress and blockers.",
          "Weekly sprint planning and retrospective sessions.",
          "Shared project board (Trello/Jira/GitHub Projects) for task tracking.",
          "Documentation in shared wiki (Notion/Confluence) for knowledge base.",
        ]);
        return y;
      },
    },
    {
      title: "Budget & Cost Analysis",
      icon: "💰",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Development Costs");
        y = drawParagraph(doc, y, `Estimated project budget: ${p.estimatedCost || "Minimal - primarily using free/open-source tools"}`);
        y += 4;
        y = drawSubHeader(doc, y, "Cost Breakdown");
        y = drawBulletList(doc, y, [
          "Cloud Hosting (Annual): ₹0 - ₹5,000 (free tiers available on Vercel, Netlify, AWS).",
          "Domain Name (Annual): ₹500 - ₹1,500 for a custom domain.",
          "Database (Monthly): ₹0 - ₹2,000 (free tiers on Supabase, PlanetScale, MongoDB Atlas).",
          "CI/CD Pipeline: ₹0 (GitHub Actions free for public repos, generous limits for private).",
          "Development Tools: ₹0 (VS Code, Git, npm are free and open-source).",
          "SSL Certificate: ₹0 (Let's Encrypt provides free SSL certificates).",
          "Third-party APIs: ₹0 - ₹3,000/month depending on usage (most have free tiers).",
          "Testing Tools: ₹0 (Jest, Vitest, Cypress community edition are free).",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Total Estimated Cost");
        y = drawParagraph(doc, y, "Minimum Viable Product: ₹0 - ₹2,000 (using all free tiers)");
        y = drawParagraph(doc, y, "Production Ready: ₹3,000 - ₹10,000 per year (with custom domain and paid hosting)");
        y = drawParagraph(doc, y, "Enterprise Scale: ₹50,000+ per year (dedicated infrastructure and premium services)");
        return y;
      },
    },
    {
      title: "Risk Assessment",
      icon: "⚠️",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Risk Matrix");
        const risks = [
          { risk: "Scope Creep", probability: "High", impact: "Medium", mitigation: "Strict feature freeze after planning phase, MoSCoW prioritization, and change request process." },
          { risk: "Technical Complexity", probability: "Medium", impact: "High", mitigation: "Proof-of-concept for complex features early, technical spikes for unknown technologies, mentorship." },
          { risk: "Timeline Delays", probability: "Medium", impact: "Medium", mitigation: "Buffer time in each phase (20%), regular progress tracking, early identification of blockers." },
          { risk: "Team Member Unavailability", probability: "Low", impact: "High", mitigation: "Knowledge sharing sessions, pair programming, documented processes, cross-training." },
          { risk: "Security Vulnerabilities", probability: "Medium", impact: "Critical", mitigation: "Security reviews at each phase, automated vulnerability scanning, dependency updates." },
          { risk: "Data Loss", probability: "Low", impact: "Critical", mitigation: "Automated backups, version control, database replication, disaster recovery plan." },
        ];
        for (const r of risks) {
          y = drawSubHeader(doc, y, r.risk);
          y = drawParagraph(doc, y, `Probability: ${r.probability} | Impact: ${r.impact}`);
          y = drawParagraph(doc, y, `Mitigation: ${r.mitigation}`);
          y += 3;
        }
        return y;
      },
    },
    {
      title: "References & Resources",
      icon: "📖",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Official Documentation");
        y = drawBulletList(doc, y, p.techStack.map(t => `${t} Official Documentation - https://${t.toLowerCase().replace(/[^a-z0-9]/g, "")}.org (or respective official site)`));
        y += 4;
        y = drawSubHeader(doc, y, "Learning Resources");
        y = drawBulletList(doc, y, [
          `GitHub Repositories: Search "${p.githubSearchQuery || p.title}" on github.com for reference implementations.`,
          `YouTube Tutorials: Search "${p.youtubeSearchQuery || p.title + " tutorial"}" for video walkthroughs.`,
          "MDN Web Docs (developer.mozilla.org) - Web technologies reference.",
          "Stack Overflow - Community Q&A for specific implementation questions.",
          "freeCodeCamp, The Odin Project - Structured learning paths for web development.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Research Papers & Articles");
        y = drawBulletList(doc, y, [
          "IEEE Xplore, Google Scholar - Academic papers on relevant algorithms and architectures.",
          "Medium, Dev.to, Hashnode - Technical blogs and case studies from practitioners.",
          "Martin Fowler's Blog - Software architecture and design patterns.",
          "OWASP Foundation - Security guidelines and best practices.",
        ]);
        return y;
      },
    },
    {
      title: "Appendices",
      icon: "📎",
      content: (doc, y) => {
        y = drawSubHeader(doc, y, "Appendix A: Glossary");
        y = drawBulletList(doc, y, [
          "API: Application Programming Interface - contract for software component communication.",
          "CI/CD: Continuous Integration / Continuous Deployment - automated build and release pipeline.",
          "JWT: JSON Web Token - compact, URL-safe token for secure information transmission.",
          "ORM: Object-Relational Mapping - technique for querying databases using object-oriented paradigm.",
          "RLS: Row-Level Security - database feature restricting data access per row based on user context.",
          "SaaS: Software as a Service - cloud-based software delivery model with subscription pricing.",
          "REST: Representational State Transfer - architectural style for web service APIs.",
          "WebSocket: Protocol for full-duplex communication channels over a single TCP connection.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Appendix B: Environment Setup Guide");
        y = drawNumberedList(doc, y, [
          "Install Node.js (v18+) and npm from nodejs.org.",
          "Install Git from git-scm.com and configure user name/email.",
          "Clone the repository: git clone <repository-url>",
          "Install dependencies: npm install",
          "Copy environment template: cp .env.example .env",
          "Configure environment variables with your API keys and database URL.",
          "Run database migrations: npm run migrate",
          "Start development server: npm run dev",
          "Open http://localhost:5173 in your browser.",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Appendix C: API Endpoints Reference");
        y = drawBulletList(doc, y, [
          "POST /api/auth/register - User registration",
          "POST /api/auth/login - User authentication",
          "GET /api/users/profile - Get current user profile",
          "PUT /api/users/profile - Update user profile",
          "GET /api/items - List items with pagination and filtering",
          "POST /api/items - Create new item",
          "GET /api/items/:id - Get item details",
          "PUT /api/items/:id - Update item",
          "DELETE /api/items/:id - Delete item",
          "GET /api/search?q=query - Full-text search",
          "GET /api/analytics/dashboard - Dashboard metrics",
        ]);
        y += 4;
        y = drawSubHeader(doc, y, "Appendix D: Project Checklist");
        y = drawBulletList(doc, y, [
          "[ ] Requirements document finalized and approved",
          "[ ] Development environment set up and verified",
          "[ ] Database schema designed and migrations created",
          "[ ] Authentication system implemented and tested",
          "[ ] Core features developed and functional",
          "[ ] Unit tests written (80%+ coverage)",
          "[ ] Integration tests passing",
          "[ ] Security audit completed",
          "[ ] Performance benchmarks met",
          "[ ] Documentation completed",
          "[ ] Deployment pipeline configured",
          "[ ] Production deployment successful",
          "[ ] Final presentation prepared",
        ]);
        return y;
      },
    },
  ];
}

export function downloadDetailedProjectPDF(p: ProjectIdea) {
  const doc = new jsPDF("p", "mm", "a4");
  
  // Build cover page
  buildCoverPage(doc, p);

  // Build TOC
  buildTOC(doc);

  // Build chapters
  const chapters = generateChapterContent(p);
  for (const chapter of chapters) {
    doc.addPage();
    let y = 25;
    y = drawSectionHeader(doc, y, chapter.title, chapter.icon);
    y += 5;
    chapter.content(doc, y);
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  doc.save(`${p.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}_Full_Project_Document.pdf`);
  toast.success("Detailed project document downloaded! (~40-50 pages)");
}
