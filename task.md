# AI一键生成习题组
在习题组管理页面添加习题旁边新增一个按钮：AI一键生成习题组
- 点击后弹出弹窗，中间有两个大选项，1.上传图片生成  2.信息生成
- 1上传图片生成先不做。当用户点了2.后，弹窗内容改为让用户输入或选择信息：习题组名称，选择学科，题目类型，相关课程（以上为必填），题目相关性，题目难度（非必填）
- 当题目类型选了选择题，点击下方生成按钮，创建一个习题组，并等待调用getChoiceExerciseList接口返回成功后，根据数组拼接上面选择的数据，拼接好数据并自动创建习题并添加到该习题组内
接口getChoiceExerciseList返回一个数组，里面是习题对象，该对象内包含习题所需的部分字段。示例:
[
  {
    "title": "加法运算",
    "type": "choice",
    "difficulty": 1,
    "question": "计算：2 + 3 =?",
    "options": [
      {"text": "4", "isCorrect": false},
      {"text": "5", "isCorrect": true},
      {"text": "6", "isCorrect": false},
      {"text": "7", "isCorrect": false}
    ],
    "correctAnswer": 1,
    "explanation": "2加3等于5"
  },
  ...
  ...
]
- 完全完成后，提示创建成功