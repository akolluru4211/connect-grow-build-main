-- Clear existing data (optional, but requested "change all")
-- TRUNCATE jobs CASCADE;
-- TRUNCATE opportunities CASCADE;
-- TRUNCATE companies CASCADE;

-- 1. Insert Top/Mid Companies
INSERT INTO companies (id, name, logo_url, industry, website_url, description) VALUES
(gen_random_uuid(), 'Google', 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg', 'Technology', 'https://google.com', 'Global leader in search, advertising, cloud computing, and AI.'),
(gen_random_uuid(), 'Microsoft', 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg', 'Software', 'https://microsoft.com', 'World largest software company, developer of Windows, Azure, and Office.'),
(gen_random_uuid(), 'Amazon', 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', 'E-commerce', 'https://amazon.com', 'Customer-centric company specializing in e-commerce, cloud (AWS), and streaming.'),
(gen_random_uuid(), 'Meta', 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg', 'Social Media', 'https://meta.com', 'Building the future of social connection and the metaverse.'),
(gen_random_uuid(), 'NVIDIA', 'https://upload.wikimedia.org/wikipedia/sco/2/21/Nvidia_logo.svg', 'Semiconductors', 'https://nvidia.com', 'Pioneer in GPU-accelerated computing and AI hardware.'),
(gen_random_uuid(), 'Stripe', 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg', 'Fintech', 'https://stripe.com', 'Financial infrastructure for the internet.'),
(gen_random_uuid(), 'OpenAI', 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', 'Artificial Intelligence', 'https://openai.com', 'AI research and deployment company behind ChatGPT.'),
(gen_random_uuid(), 'Airbnb', 'https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Belo.svg', 'Hospitality', 'https://airbnb.com', 'Online marketplace for lodging and tourism experiences.'),
(gen_random_uuid(), 'Reddit', 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Reddit_logo.svg', 'Social Media', 'https://reddit.com', 'The front page of the internet.');

-- 2. Insert Real Software Engineering Internships
-- Note: We use subqueries to find the company IDs we just created
INSERT INTO opportunities (id, title, organization, type, location, stipend, duration, deadline, application_link, tags, is_active) VALUES
(gen_random_uuid(), 'Software Engineering Intern, Summer 2025', 'Google', 'internship', 'Mountain View / New York / Remote', 'Competitive (+ Housing)', '12-14 Weeks', '2024-12-01', 'https://www.google.com/about/careers/applications/jobs/results/?q=software%20engineering%20intern', ARRAY['React', 'Go', 'Python', 'C++'], true),
(gen_random_uuid(), 'Explorer Program (Freshman/Sophomore)', 'Microsoft', 'internship', 'Redmond, WA', 'Paid Internship', '12 Weeks', '2024-11-15', 'https://careers.microsoft.com/us/en/job/1660999/Software-Engineering-Explorer-Intern', ARRAY['Java', 'C#', 'SQL'], true),
(gen_random_uuid(), 'Software Development Engineer Intern', 'Amazon', 'internship', 'Seattle / Austin / Remote', 'High Stipend + Relocation', '3 Months', '2024-12-31', 'https://www.amazon.jobs/en/search?base_query=software+development+engineer+intern', ARRAY['Java', 'Distributed Systems', 'AWS'], true),
(gen_random_uuid(), 'Software Engineering Intern (Meta University)', 'Meta', 'internship', 'Menlo Park, CA', 'Paid', '10 Weeks', '2024-10-31', 'https://www.metacareers.com/jobs/?q=software%20engineer%20intern', ARRAY['React Native', 'Hack', 'C++'], true),
(gen_random_uuid(), 'Deep Learning Software Intern', 'NVIDIA', 'internship', 'Santa Clara, CA', 'Competitive', '4-6 Months', '2025-01-15', 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite?q=intern', ARRAY['PyTorch', 'CUDA', 'C++'], true),
(gen_random_uuid(), 'Software Engineering Intern, Backend', 'Stripe', 'internship', 'San Francisco / Remote', 'High Salary', '12 Weeks', '2024-11-20', 'https://stripe.com/jobs/search?query=intern', ARRAY['Ruby', 'Go', 'Architecture'], true);

-- 3. Insert Real Full-Time Software Jobs (New Grad / Mid Level)
INSERT INTO jobs (id, title, company_id, location, job_type, experience_level, salary_min, salary_max, requirements, is_active, description) VALUES
(gen_random_uuid(), (SELECT id FROM companies WHERE name='Google'), 'New York, NY', 'Full-time', 'Entry Level', 140000, 185000, ARRAY['BS in CS', 'Algorithms', 'JavaScript/TypeScript'], true, 'Google is hiring new grads for 2025 to work on Search and Cloud.'),
(gen_random_uuid(), (SELECT id FROM companies WHERE name='Stripe'), 'Remote, US', 'Full-time', 'Senior', 190000, 260000, ARRAY['5+ years experience', 'Distributed Systems', 'API Design'], true, 'Lead the financial infrastructure team building global payment rails.'),
(gen_random_uuid(), (SELECT id FROM companies WHERE name='OpenAI'), 'San Francisco, CA', 'Full-time', 'Mid Level', 200000, 350000, ARRAY['LLM Foundations', 'Python', 'PyTorch'], true, 'Build the next generation of generative AI models.');

-- 4. Insert Hackathons
INSERT INTO opportunities (id, title, organization, type, location, stipend, deadline, application_link, tags, is_active) VALUES
(gen_random_uuid(), 'Major League Hacking 2024 Season', 'MLH', 'hackathon', 'Global / Various Locations', '$10,000+ Prizes', '2024-12-31', 'https://mlh.io/seasons/2024/events', ARRAY['Building', 'Teams', 'Workshops'], true),
(gen_random_uuid(), 'ETH Global: San Francisco', 'ETH Global', 'hackathon', 'San Francisco / Hybrid', '$50,000+ Pool', '2024-11-10', 'https://ethglobal.com/', ARRAY['Web3', 'Solidity', 'Blockchain'], true),
(gen_random_uuid(), 'Smart India Hackathon 2024', 'Govt. of India', 'hackathon', 'India (Physical/Hybrid)', '1 Lakh INR', '2024-10-15', 'https://www.sih.gov.in/', ARRAY['Problem Solving', 'Innovation', 'Hardware/Software'], true);
