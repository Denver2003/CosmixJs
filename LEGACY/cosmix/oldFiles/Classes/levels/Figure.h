#ifndef Boltrix_Figure_h
#define Boltrix_Figure_h

#include "cocos2d.h"
#include "Stage.h"

using namespace cocos2d;
using namespace std;

#define TAG_FROM 10000

class Figure
{
public:
	Figure(string _label, string _spriteName, int _tag, int _count, ccColor3B _color );
	~Figure(void);

    string getSpriteName();
	string getBatchSpriteName();
	string getBatchSpriteNameNoPhysics();
	string getBatchSpriteNameEye();
    
    string getSpriteName_01();
    string getAnimWalkName();
    string getAnimBlinkName();
    string getAnimBangName();
    string getAnimEyeWalk();
    string getAnimEyeBlink();
    string getAnimEyeFall();
    string getAnimColors();
    

    
    //---------------------------------------

    string label;

    string  spriteName;     //    имя спрайта фигуры
    int     tag;            //    тэг фигуры
    int     color_index;    //    индекс цвета фигуры
    

        
    ccColor3B color;        //    цвет
    int     count;          // процент генерации(1-10) 1 - 10% 10 - 100%

public:
    string animPrefix;
    
};
#endif
