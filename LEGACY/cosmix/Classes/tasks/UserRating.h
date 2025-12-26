//
//  UserRating.h
//  cosmix
//
//  Created by denver on 05.09.13.
//
// class for calculate user rating
// when user decided a task he takes one experience point
// five expirience poins give one level
// every 5 levels raiting of user will be to increase

#ifndef __cosmix__UserRating__
#define __cosmix__UserRating__

#include "LevelHelperLoader.h"
USING_NS_CC;
// у игрока есть уровень(начинает игрок с 1-го уровня)
// для перехода на следующий уровень, необходимо набрать 5 очков опыта
// так же у игрока есть его рейтинг(новичек,начинающий, средний, нормальный, и т.п.)
// рейтинг увеличивается исходя из таблицы ratingNamesList
/*
старая таблица рейтингов
#define RATING_NEWBY        1
#define RATING_BEGINNER     5
#define RATING_INTERMEDIATE 10
#define RATING_ADVANCED     20
#define RATING_EXPERT       30
#define RATING_COSMONAUT    45
#define RATING_LORD         60*/

#define RATING_NEWBY        1
#define RATING_BEGINNER     5
#define RATING_INTERMEDIATE 10
#define RATING_ADVANCED     15
#define RATING_EXPERT       20
#define RATING_COSMONAUT    30
#define RATING_LORD         40

// одно очко опыта дается за одно выполненное задание!
#define MAX_HP 5
class CTask;

class UserRating : public CCObject
{
public:
    int stars;
    int level;
    int rating;
    
    int localStars;

    int prevStars;
    int prevLevel;
    int prevRating;
    int prevLocalStars;

    
    bool isNewStar;         // за игру выполнено хотя бы одно задание
    bool isNewLevel;        // за игру был увеличен уровень
    bool isNewRating;       // за игру поднялся рейтинг
    
    int showRatingFrom;

    // флаги текущеей игры
    //список выполненных задач на текущем уровне
    std::vector<CTask *> completedTasks;
    std::vector<LHSprite *> starCenters;
    std::vector<CCNode *> movingSprites;
    
    LHSprite * nextStarSprite;
    CCPoint endTaskLabelPoint;
    
    bool init;
    
    CTask * currentTask;
    
    void completeTask(CTask * task);
    void load(void);
    void save(void);
    void calculate(void);
    int ratingByLevel(int _level);
    int ratingByStars(int _starCount);
    //события, которые запускаются при начале игры и ее конце
    void onBeginGame();
    void onEndGame(LevelHelperLoader * loader);

    void onPreShowRatingMenu(CCObject * object);
    void onAfterShowRatingMenu(CCObject * object);
    void onAfterRatingShown(void);
    void onNextButton(CCObject * object);

    void addingTaskStar(CCObject * object);
    void addingTaskStarStep2(CCObject * object);
    void addingTaskStarStep3(CCObject * object);
    
    void onNewRating(int rating);
    void onNewStar  (int star);
    void onNewLevel (int level);
    
    static UserRating * getInstance();
    static void destroyInstance();

    
    
protected:
    UserRating();
    ~UserRating();
    static UserRating * mInstance;
};

#endif /* defined(__cosmix__UserRating__) */
