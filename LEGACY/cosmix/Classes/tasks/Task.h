//
//  Task.h
//  cosmix
//
//  Created by denver on 03.09.13.
//
//

#ifndef __cosmix__Task__
#define __cosmix__Task__

#include "cocos2d.h"

USING_NS_CC;

class CTask : public CCObject
{
public:
    //общие
    
    int type;       // тип задания
    bool done;      // задание еще выполнено
    bool failed;    // задание уже провалено
    // если done = true, то задание по любому уже выполнено
    // если failed = true, то задание по любому провалено
    int unique;                 // уникальный идентификатор задания
    std::string text;           // текстовая информация о задаче
    
    bool isCleared;             // задание пройдено, больше его не выбирать
    int countToPass;            // количество игр, через которое можно пропустить задание за деньги
    
//    int currentObjectives;      //текущее количество объектов
//    int reachObjectives;        // необходимо достигнуть

    int initValue1;
    int currentValue1;          //текущее количество объектов
    int reachValue1;            //текущее количество объектов

    int initValue2;
    int currentValue2;          //текущее количество объектов
    int reachValue2;            //текущее количество объектов
    
    int price;                  // цена пропуска задания
    int level;                  // минимальный уровень для задания
    int award;                  // бонус за задание
    
    CTask * taskInfo;           // шаблон задачи
    int taskCountInGame;        // количество раз, которое задание предлагалось игроку...после 3-х раз позволено выкупать задание
    bool canPass;
    float delay;
    
public:
    CTask(int _type);
    ~CTask();

    void beforeGame();
    void afterGame();
    virtual bool check(void);
    
    void taskIsDone(void);

    
    void setInitValue1(int _val);
    void setInitValue2(int _val);
    void addValue1(int _val);
    void addValue2(int _val);
    void clearValue1(void);
    void clearValue2(void);

    bool isReached1(void);
    bool isReached2(void);
    
    bool setDone(void);
    bool setFailed(void);

    virtual void init(void);
    virtual void initOnce(void);
    virtual void save(void);
    virtual void load(void);
    virtual void setText(std::string _text);
    virtual void onEndGame(void);
    virtual std::string getText(void);
    
};
#endif /* defined(__cosmix__Task__) */
