#ifndef Boltrix_Level_h
#define Boltrix_Level_h

#include "cocos2d.h"
#include "Stage.h"
#include "LevelPack.h"

using namespace cocos2d;
class LevelPack;
class Stage;
class Bonus;
class Level
{
public:
	Level(string _label,string _scene, string _name);
	~Level(void);
    //---------------------------------------
        
    void addStage(Stage * stage );
	Stage * getStage( int indexStage );

	void addColor(int tag, int r, int g, int b);
	ccColor3B getColor( int tag );
    
        
    string label;               //    имя уровня
    string name;                //    имя уровня
    string scene;               //    имя файла левел хелпера
    
    
    
    vector<Stage * > stages;    //      уровни
    vector<Bonus * > bonuses;    //      уровни
    
    
    LevelPack * parent;
        
    
    int hiScore;

	map<int, ccColor3B> colors;

    
};

#endif