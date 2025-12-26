#ifndef Boltrix_Stage1_h
#define Boltrix_Stage1_h

#include "cocos2d.h"
#include "Level.h"
#include "Figure.h"

using namespace cocos2d;
class Level;
class Figure;
class Stage
{
public:
    Stage();
	Stage(string _label, float _time, int _points, int _starOne, int _starTwo, int _starThree, int _rotationAngle, int _bonusTime );
	~Stage(void);
    void Init(string _label, float _time, int _points, int _starOne, int _starTwo,int _starThree,int _rotationAngle, int _bonusTime);
    
    //---------------------------------------
    void addFigure(Figure * figure);
    
    Figure * randomFigure();
    

    
    /// STATIC ------------------
    static Stage * cloneStage( Stage * stage, Stage * toStage );
    //// properties
    
    string label;
        
    float   waiting_time;           //время для управления фигурой
        
    int     points;                 //очки до следующей стадии\уровня

    vector<Figure *> figures;       //все фигуры

    vector<Figure *> genFigures;    //    фигуры для генерации новой
    Level * parent;

	map<int,int> uniqueTags;// набор уникальных тэгов для стадии игры
    
    int starOne;
    int starTwo;
    int starThree;
	int rotationAngle;
    int userLevel;
	int bonusTime;
};
#endif