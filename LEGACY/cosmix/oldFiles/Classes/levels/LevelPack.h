#ifndef Boltrix_LevelPack_h
#define Boltrix_LevelPack_h

#include "cocos2d.h"
#include "Quest.h"
#include "Level.h"

using namespace cocos2d;
class Level;
class LevelPack
{
public:
	LevelPack(string _label,string _name);
	~LevelPack(void);

    
    void addLevel(Level * level);  
        
    Level * getCurLevel();
    Quest * getCurQuest();    
    
    Level * getLevelByName( string _name );

    
    Level * moveToNextLevel();
    
    string  name; ///unique name
    string  label;    
    //int     curLevelIndex;
    
    int multiplier;
    
    map<string,Level *> levels;
    vector<Quest *> quests;
    int currentQuestIndex;

};
#endif