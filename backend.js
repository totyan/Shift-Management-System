//---------- 初期設定項目 ----------
let spreadSheetURL = 'your_spreadSheetURL'
let slackChannelURL = "your_slack_channel_url"
//--------------------------------


let spreadSheet = SpreadsheetApp.openByUrl(spreadSheetURL)
var TIME_START_Y = 1;
var user = Session.getActiveUser();
var email = user.getEmail();
var html=HtmlService.createTemplateFromFile('front');
let mailNameList = spreadSheet.getSheetByName('mail_name').getDataRange().getValues().flat()
let nameIndex = mailNameList.indexOf(email) + 1
let name = mailNameList[nameIndex]


let sheetNames = spreadSheet.getSheets().map(sheet => sheet.getName()).reverse();
var newFileName = ""
for(i=0; i< sheetNames.length; i++){
  if(sheetNames[i].match("new_")){
    newFileName = sheetNames[i]
    break;
  }
}

_sheet = spreadSheet.getSheetByName(newFileName)
_sheet_data  = _sheet.getDataRange().getValues();
let nextDates = newFileName.split("_")[1]


function makeSentence(restShiftList){
  let mkSentence = []
  var thisDate = new Date()
  let startMonth = Number(nextDates.split("月")[0])-1
  let startDay = Number(nextDates.split("月")[1].split("日")[0])
  var thisdd = ""
  thisDate.setMonth(startMonth)
  thisDate.setDate(startDay)
  for(i=0; i< restShiftList.length; i++){
    thisDate.setMonth(startMonth)
    thisDate.setDate(startDay)
    if(restShiftList[i][0]=="月"){
      thisdd = (thisDate.getMonth()+1) + "月" + thisDate.getDate()+"日"
    }else if(restShiftList[i][0]=="火"){
      thisDate.setDate(thisDate.getDate()+1)
      thisdd = thisDate.getMonth()+1 + "月" + thisDate.getDate()+"日"
    }else if(restShiftList[i][0]=="水"){
      thisDate.setDate(thisDate.getDate()+2)
      thisdd = thisDate.getMonth()+1 + "月" + thisDate.getDate()+"日"
    }else if(restShiftList[i][0]=="木"){
      thisDate.setDate(thisDate.getDate()+3)
      thisdd = thisDate.getMonth()+1 + "月" + thisDate.getDate()+"日"
    }else if(restShiftList[i][0]=="金"){
      thisDate.setDate(thisDate.getDate()+4)
      thisdd = thisDate.getMonth()+1 + "月" + thisDate.getDate()+"日"
    }
    
    let message = thisdd + "("+restShiftList[i][0]+")　"+ restShiftList[i][2] + "〜" + restShiftList[i][3] + " (" + restShiftList[i][1] + ")"
    mkSentence.push( message )
  }
  return mkSentence;
}

function mailTest(restShiftList, message){
  const recipient = email; //送信先のメールアドレス
  const subject = 'シフトキャンセル申請を受け付けました';

  const recipientName = name;
  const body = `${recipientName}さん\n\n以下のシフトをキャンセルしました\n申請を取り消したい場合は急募申請を行ってください\n\n`+message.join('\n');
  GmailApp.sendEmail(recipient, subject, body);
}

function noneMailTest(message){
  const recipient = email; //送信先のメールアドレス
  const subject = '急募申請を受け付けました';
  const recipientName = name;
  const body = `${recipientName}さん\n\n以下のシフトを追加しました\n申請を取り消したい場合はキャンセル申請を行ってください\n\n`+message.join('\n');
  GmailApp.sendEmail(recipient, subject, body);
}

function notifySlack(massage) {
  let postUrl  = slackChannelURL
  let userName = "急募通知bot"   // Slackに通知する時の名前になります
  let message  = massage+'\n勤務可能な方はシステムで申請してください' // 送信するメッセージ
  let jsonData = {
    "username" : userName,
    "text" : message
  }  
  // 上の送信内容を設定  
  let payload = JSON.stringify(jsonData)
  // オプションを設定
  let options =
  {
    "method" : "post",
    "contentType" : "application/json",
    "payload" : payload
  };
  // Slackに通知する
  UrlFetchApp.fetch(postUrl, options);  
}

function removeDataSheet(restShiftList){
  for(i=0; i<restShiftList.length; i++){
    let startHourMinute = restShiftList[i][2].split(":")
    let endHourMinute = restShiftList[i][3].split(":")
    let row = ( ( Number(startHourMinute[0])*60 + Number(startHourMinute[1]) ) - 570 ) / 5 + 2
    let rowLength = ( ( ( Number(endHourMinute[0])*60 + Number(endHourMinute[1]) ) - 570 ) / 5 + 2 ) - row
    var colunm = 0

    if(restShiftList[i][0]=="月"){
      colunm += 2
    }else if(restShiftList[i][0]=="火"){
      colunm += 6
    }else if(restShiftList[i][0]=="水"){
      colunm += 10
    }else if(restShiftList[i][0]=="木"){
      colunm += 14
    }else if(restShiftList[i][0]=="金"){
      colunm += 18
    }

    if(restShiftList[i][1]=="受付"){
      colunm += 2
    }
    if(_sheet_data[row-1][colunm-1]!=name){
      colunm += 1
    }
    _sheet.getRange(row, colunm, rowLength, 1).setValue("None")
  }
}

function setDataSheet(restShiftList){
  var tmpRepository = []
  let nowDataList = _sheet.getDataRange().getValues();
  for(i=0; i<restShiftList.length; i++){
    let startHourMinute = restShiftList[i][2].split(":")
    let endHourMinute = restShiftList[i][3].split(":")
    let row = ( ( Number(startHourMinute[0])*60 + Number(startHourMinute[1]) ) - 570 ) / 5 + 2
    let rowLength = ( ( ( Number(endHourMinute[0])*60 + Number(endHourMinute[1]) ) - 570 ) / 5 + 2 ) - row
    var colunm = 0

    if(restShiftList[i][0]=="月"){
      colunm += 2
    }else if(restShiftList[i][0]=="火"){
      colunm += 6
    }else if(restShiftList[i][0]=="水"){
      colunm += 10
    }else if(restShiftList[i][0]=="木"){
      colunm += 14
    }else if(restShiftList[i][0]=="金"){
      colunm += 18
    }

    if(restShiftList[i][1]=="受付2"){
      colunm += 2
    }
    if(_sheet_data.slice(row-1,row+rowLength-1).map(item => item[colunm-1]).filter(n => n !== 'None').length){
      colunm += 1
    }
    // もしNone以外の文字列があった場合
    if(nowDataList.slice(row-1,row+rowLength-1).map(item => item[colunm-1]).filter(n => n !== 'None').length){
      return '異常';
    }
    tmpRepository.push([row, restShiftList[i][4], rowLength])
  }
  for(i=0; i<tmpRepository.length; i++){
    Logger.log(restShiftList[i][4]+1)
    _sheet.getRange(tmpRepository[i][0], Number(tmpRepository[i][1])+1, tmpRepository[i][2], 1).setValue(name)
  }
  return '正常';
}

function test(name){
  _time_list = [];
  _tempShiftList = [];
  _personalShiftList = [];
  _time = new Date("2000/01/01 09:30");
  Logger.log(_time)
  for(i=0; i<= 90; i++){
    _time_list[i] = Utilities.formatDate(_time, 'JST', 'HH:mm');
    _time.setMinutes(_time.getMinutes() + 5);
  }
  Logger.log(_time_list)

  // 1列ずつ出力
  print_col(1, "月", "受付1");
  print_col(2, "月", "受付1");
  print_col(3, "月", "受付2");
  print_col(4, "月", "受付2");
  print_col(5, "火", "受付1");
  print_col(6, "火", "受付1");
  print_col(7, "火", "受付2");
  print_col(8, "火", "受付2");
  print_col(9, "水", "受付1");
  print_col(10, "水", "受付1");
  print_col(11, "水", "受付2");
  print_col(12, "水", "受付2");
  print_col(13, "木", "受付1");
  print_col(14, "木", "受付1");
  print_col(15, "木", "受付2");
  print_col(16, "木", "受付2");
  print_col(17, "金", "受付1");
  print_col(18, "金", "受付1");
  print_col(19, "金", "受付2");
  print_col(20, "金", "受付2");

  for(i=0; i< _tempShiftList.length; i++){
    if(_tempShiftList[i][0]==name){
      _personalShiftList.push( _tempShiftList[i] )
    }
  }
  return _personalShiftList;
}


function print_col(x, aaa, work_type){
  var _staff_name = "";
  var _start_time;
  for(y=TIME_START_Y; y<=91; y++){
    if(_staff_name == "" && _sheet_data[y][x] != ""){
      _staff_name = _sheet_data[y][x];
      _start_time = _time_list[y - TIME_START_Y];    
      continue;
    }
    if(_staff_name != _sheet_data[y][x]){
      var _output = [_staff_name, aaa, _start_time, _time_list[y - TIME_START_Y], work_type];
      _staff_name = _sheet_data[y][x];
      _start_time = _time_list[y - TIME_START_Y];
      _tempShiftList.push( _output )
    }
  }
}


function nonetest(name){
  _time_list = [];
  _tempShiftList = [];
  _personalShiftList = [];
  _time = new Date("2000/01/01 09:30");
  for(i=0; i<= 90; i++){
    _time_list[i] = Utilities.formatDate(_time, 'JST', 'HH:mm');
    _time.setMinutes(_time.getMinutes() + 5);
  }

  // 1列ずつ出力
  noneprint_col(1, "月", "受付1");
  noneprint_col(2, "月", "受付1");
  noneprint_col(3, "月", "受付2");
  noneprint_col(4, "月", "受付2");
  noneprint_col(5, "火", "受付1");
  noneprint_col(6, "火", "受付1");
  noneprint_col(7, "火", "受付2");
  noneprint_col(8, "火", "受付2");
  noneprint_col(9, "水", "受付1");
  noneprint_col(10, "水", "受付1");
  noneprint_col(11, "水", "受付2");
  noneprint_col(12, "水", "受付2");
  noneprint_col(13, "木", "受付1");
  noneprint_col(14, "木", "受付1");
  noneprint_col(15, "木", "受付2");
  noneprint_col(16, "木", "受付2");
  noneprint_col(17, "金", "受付1");
  noneprint_col(18, "金", "受付1");
  noneprint_col(19, "金", "受付2");
  noneprint_col(20, "金", "受付2");

  for(i=0; i< _tempShiftList.length; i++){
    if(_tempShiftList[i][0]==name){
      _personalShiftList.push( _tempShiftList[i] )
    }
  }
  return _personalShiftList;
}


function noneprint_col(x, aaa, work_type){
  var _staff_name = "";
  var _start_time;
  for(y=TIME_START_Y; y<=91; y++){
    if(_staff_name == "" && _sheet_data[y][x] != ""){
      _staff_name = _sheet_data[y][x];
      _start_time = _time_list[y - TIME_START_Y];    
      continue;
    }
    if(_staff_name != _sheet_data[y][x]){
      var _output = [_staff_name, aaa, _start_time, _time_list[y - TIME_START_Y], work_type, x];
      _staff_name = _sheet_data[y][x];
      _start_time = _time_list[y - TIME_START_Y];
      _tempShiftList.push( _output )
    }
  }
}


// 定休日がある場合表示させる
function teikyuubi(){
  var resultYasumi = '・'
  if(_sheet_data.slice(1).map(item => item[1]).filter(n => n !== '').length == 0 && _sheet_data.slice(1).map(item => item[2]).filter(n => n !== '').length== 0 && _sheet_data.slice(1).map(item => item[3]).filter(n => n !== '').length== 0 && _sheet_data.slice(1).map(item => item[4]).filter(n => n !== '').length== 0){
    resultYasumi += '月'
  }
  if(_sheet_data.slice(1).map(item => item[5]).filter(n => n !== '').length == 0 && _sheet_data.slice(1).map(item => item[6]).filter(n => n !== '').length== 0 && _sheet_data.slice(1).map(item => item[7]).filter(n => n !== '').length== 0 && _sheet_data.slice(1).map(item => item[8]).filter(n => n !== '').length== 0){
    resultYasumi += '火'
  }
  if(_sheet_data.slice(1).map(item => item[9]).filter(n => n !== '').length == 0 && _sheet_data.slice(1).map(item => item[10]).filter(n => n !== '').length== 0 && _sheet_data.slice(1).map(item => item[11]).filter(n => n !== '').length== 0 && _sheet_data.slice(1).map(item => item[12]).filter(n => n !== '').length== 0){
    resultYasumi += '水'
  }
  if(_sheet_data.slice(1).map(item => item[13]).filter(n => n !== '').length == 0 && _sheet_data.slice(1).map(item => item[14]).filter(n => n !== '').length== 0 && _sheet_data.slice(1).map(item => item[15]).filter(n => n !== '').length== 0 && _sheet_data.slice(1).map(item => item[16]).filter(n => n !== '').length== 0){
    resultYasumi += '木'
  }
  if(_sheet_data.slice(1).map(item => item[17]).filter(n => n !== '').length == 0 && _sheet_data.slice(1).map(item => item[18]).filter(n => n !== '').length== 0 && _sheet_data.slice(1).map(item => item[19]).filter(n => n !== '').length== 0 && _sheet_data.slice(1).map(item => item[20]).filter(n => n !== '').length== 0){
    resultYasumi += '金'
  }
  if(resultYasumi == '・'){
    return '';
  }else{
    resultYasumi += 'は休み'
  }
  return resultYasumi
}


// URLを踏むと実行される関数
function doGet() {
  yyy = teikyuubi()
  ddd = test(name)
  eee = nonetest("None")
  html.shifts=ddd;
  html.noneshifts=eee;
  html.nextDate=nextDates;
  html.myName=name;
  html.yyasumi = yyy;
  return html.evaluate().setTitle('シフト調整');
}

// html側の送信ボタンを押された時に実行される関数
function doSend(restShiftList){
  removeDataSheet(restShiftList)
  message = makeSentence(restShiftList)
  mailTest(restShiftList,message)
  for(i=0; i< message.length; i++){
    notifySlack(message[i])
  }
}

// html側のnone送信ボタンを押された時に実行される関数
function doNoneSend(restShiftList){
  var scriptLock = LockService.getScriptLock();
  if (scriptLock.tryLock(0)) {
    var ansb = setDataSheet(restShiftList)
    message = makeSentence(restShiftList)
    if(ansb=='正常'){
      noneMailTest(message)
    }
    for(i=0; i< message.length; i++){
      notifySlack(message[i])
    scriptLock.releaseLock();
    return ansb;
  }
  return '更新'
}
