
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, points) VALUES
('Game Starter', 'Play your first game', 'zap', 'games', 'game_played', 1, 25),
('Game Enthusiast', 'Play 5 different games', 'zap', 'games', 'games_played', 5, 75),
('Game Champion', 'Play 20 games total', 'trophy', 'games', 'games_played', 20, 150),
('Speed Demon', 'Complete the Reaction Speed game', 'zap', 'games', 'reaction_speed', 1, 50),
('Code Detective', 'Complete 5 Code Debugger challenges', 'target', 'games', 'code_debugger', 5, 100),
('Word Wizard', 'Complete 10 Word Scramble rounds', 'star', 'games', 'word_scramble', 10, 75),
('Typing Pro', 'Achieve 50+ WPM in Typing Speed', 'zap', 'games', 'typing_speed', 50, 100),
('Quiz Master', 'Answer 20 quiz questions correctly', 'award', 'games', 'quiz_correct', 20, 100),
('Memory Expert', 'Complete Memory Game level 5', 'star', 'games', 'memory_game', 5, 75),
('Pattern Genius', 'Complete 10 Pattern Game rounds', 'target', 'games', 'pattern_game', 10, 100),
('Emoji Expert', 'Decode 10 emoji puzzles', 'star', 'games', 'emoji_decoder', 10, 75),
('Eagle Eye', 'Complete Spot Difference level 8', 'target', 'games', 'spot_difference', 8, 100),
('Trivia King', 'Answer 15 trivia questions correctly', 'trophy', 'games', 'trivia_correct', 15, 100),
('Mock Veteran', 'Complete 5 mock interviews', 'video', 'interview', 'mock_interview', 5, 150),
('Interview Expert', 'Complete 10 mock interviews', 'trophy', 'interview', 'mock_interview', 10, 300),
('High Scorer', 'Score 8+ on a mock interview', 'star', 'interview', 'mock_interview_score', 8, 200);
