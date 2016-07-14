function EditableTable(opts)
{
    var defaults = {
            deleteRows      : true,
            tabToMove       : true,
            arrowsToMove    : true,
            saveOnLooseFocus: false,
            standardDates   : true,
            checkBoxBools   : true,
            id              : "EditableTable",
            headers         : [["name","dataType", true]], // [["name", "datatype", column editable?]]
        };
    let options = $.extend({}, defaults, opts);

    const KEYS = {ENTER:13, ESCAPE:27, TAB:9, UNDO:90, REDO:89, LEFT:37, UP:38, RIGHT:39, DOWN:40}
    let ost = this;
    options["jid"] = '#' + options["id"]+ ' ';
    let columns = 0, rows = 0;
    let undoStack = [];
    let redoStack = [];
    //this.validation = validation;

    this.make = function(data)
    {
        let oldTableBody = $(options["jid"]+' table').clone();
        columns = data[0].length;
        rows = data.length;
        this.redoStack = [];
        $(options["jid"]+' table tbody').remove();
        let thead = $('<tr>');
        options["headers"].forEach(function(value) {thead.append('<th>'+value[0]+'</th>')});
        let tbody = $('<tbody>');
        for(let row=0; row<data.length;row++)
        {
            let trow = $('<tr id="tableRow'+row+'">');
            for(let col=0;col<data[row].length;col++)
            {
                let cellData = data[row][col];
                if(typeof cellData === 'undefined' && cellData == null)
                    cellData = '';
                if (options["headers"][col][1] == "date" && options["standardDates"]) 
                {
                    cellData = formatDate(cellData);
                }
               let cell;
                if (options["headers"][col][1] == "bool" && options["checkBoxBools"]) 
                {
                    if (cellData == "true") 
                    {
                        cell = $('<td id="cell'+row+'-'+col+'">').append($('<input type="checkbox" value="" checked>'))
                    }
                    else
                    {
                        cell = $('<td id="cell'+row+'-'+col+'">').append($('<input type="checkbox" value="" >'))

                    }
                }
                else
                {
                    cell = $('<td id="cell'+row+'-'+col+'">').text(cellData);

                }
                validate(cell);
                trow.append(cell);
            }
            if (options["deleteRows"]) 
            {
                let deleteCell = $('<td class="deleteRow" id="row' + row + '"><div class="close">&times;</div></td></tr>');
                trow.append(deleteCell);
            }
            tbody.append(trow);
            
        }
        thead = $('<thead class="default-color">').append(thead);
        let table = $('<table class="table table-condensed table-striped">').append(thead).append(tbody);
        undoStack.push({
            element:{redoBody:table.clone(), undoBody:oldTableBody.clone()}
            , undo: function(element)
            {
                $(options["jid"]+' tbody').remove();
                $(options["jid"]).append(element.undoBody.clone());
            }
            , redo: function(element)
            {
                $(options["jid"]+' tbody').remove();
                $(options["jid"]).append(element.redoBody.clone());
            }
        })

        $(options["jid"]).append(table);
        this.validatTable()
    }

    this.editCell = function(elem)
    {
        if($(elem)[0] == $('.activeCell')[0])return
        ost.saveCurrentCell();
        $(elem).addClass('activeCell');
        let active = $(options["jid"] + '.activeCell');
        let id = active.attr('id').substring(4).split('-');
       
        if (options["headers"][id[1]][1] == "bool" && options["checkBoxBools"]) 
        {
            
           let checkbox =  $(elem).find('input')[0];
           $(checkbox).addClass("editCell")
        }
        else
        {
            let width = $(elem).width();
            $(elem).html('<input type="text" id="in" class="editCell form-control col-xs-2"  style="width:'+$(elem).width()+'px"value="' + $(elem).text() + '" placeholder="' + $(elem).text() + '" title="Enter to save" tabindex="-1"/>');
            $(elem).width(width);
        }
        $('.editCell').focus();
    }

    this.saveCurrentCell = function()
    {
        if($(options["jid"] + '.activeCell').length === 0)return;
        let active = $(options["jid"] + '.activeCell');
        let id = active.prop('id').substring(4).split('-');
        if (options["headers"][id[1]][1] == "bool" && options["checkBoxBools"]) 
        {
            active.removeClass('activeCell');
            let checkbox = active.find('input')[0]
            $(checkbox).removeClass("editCell")
            validate(active);
            ost.validatTable();
        }
        else
        {

            if($(options["jid"] + '.editCell').prop('placeholder') != $(options["jid"] + ' .editCell').val().trim())
            {
                undoStack.push({element: active.clone()
                    , undo: function(element) {
                        let cell = element.prop('id');
                        let text = $(element.children()[0]).prop('placeholder');
                        $(options["jid"] + ' #'+cell).text(text).css('background-color','#999999').animate({backgroundColor: '#f5f5f5'}, function() {
                            $(options["jid"] + ' #'+cell).css({'background-color':''});
                            let id = cell.substring(4).split('-');
                            validate(element);
                            ost.validatTable();
                        })
                    }
                    , redo: function(element) {
                        let cell = element.prop('id');
                        let text = $(element.children()[0]).val().trim();
                        $(options["jid"] + ' #'+cell).text(text).css('background-color','#999999').animate({backgroundColor: '#f5f5f5'}, function() {
                            $(options["jid"] + ' #'+cell).css({'background-color':''});
                            let id = cell.substring(4).split('-');
                            validate(element);
                            ost.validatTable();
                        })
                    }});
                redoStack = []
            }
            active.removeClass('activeCell col-xs-2').text($('.editCell').val().trim()).children().remove();
            validate(active);
            ost.validatTable();
        }
    }

    this.deleteRow = function(elem)
    {
        undoStack.push({element: {item: $(elem).parent().clone(), location:$(elem).parent().prev()}
					, undo: function(element) {
						if(element.location.length === 0)
							$(options["jid"]+'tbody').prepend(element.item.clone())
						else
							$(options["jid"]+'tr#' + element.location.prop('id')).after(element.item.clone());
						let clone = $(options["jid"]+'tr#'+element.item.prop('id'));
						clone.css({'background':'#999999'}).animate({backgroundColor: '#f5f5f5'}, function() {
							clone.css({'background':''});
							ost.validatTable();
						})
					}
					, redo: function(element) {
						$(options["jid"]+'tr#'+element.item.prop('id')).find('td')
						.wrapInner('<div class="wrapper" />')
						.parent().find('td > div')
						.animate({opacity:0}, function() {
							$('.wrapper').contents().unwrap();
							$(options["jid"]+'tr#'+element.item.prop('id')).remove();
							ost.validatTable();
						})
					}});
        redoStack = [];
        $(elem).parent().remove();
        ost.validatTable();
        if($(options["jid"]+'tbody tr').length == 0)
            clearTable();
    }

    this.clearTable = function()
    {
        undoStack.push({element:$(options["jid"]+'table').clone()
					, undo: function(element) {
						$(options["jid"]).append(element.clone());
						ost.validatTable();
					}
					, redo: function(element) {
						$(options["jid"]+'table').remove();
						$('#clearRatings').hide();
						$('#invalidWarning').css('display','none');
						$('#extraRowsWarning').css('display','none');
						$('#submitRatings').hide();
					}})
        redoStack = [];
        $(options["jid"]+'table').remove();
        $('#clearRatings').hide();
        $('#invalidWarning').css('display','none');
        $('#extraRowsWarning').css('display','none');
        $('#submitRatings').hide();
    }

    this.escapeCurrentCell = function()
    {
        $(options["jid"]+'.activeCell').removeClass('activeCell col-xs-2').text($(options["jid"]+'.editCell').attr('placeholder')).children().remove();
    }

    this.tabCell = function()
    {
        let active = $(options["jid"] + '.activeCell');
        let id = active.attr('id').substring(4).split('-');
        ost.saveCurrentCell();
        if(++id[1] == columns)
        {
            id[1] = 0;
            id[0]++;
        }
        if (options["headers"][id[1]][2]) 
        {
            ost.editCell($(options["jid"]+'#cell'+id[0]+'-'+id[1])[0]);
        }
        else
        {
            ost.editCell($(options["jid"]+'#cell'+id[0]+'-'+id[1])[0]);
            ost.tabCell();
        }
    }

    this.moveCell = function(y,x)
    {
        let active = $(options["jid"] + '.activeCell');
        let id = active.attr('id').substring(4).split('-');
        id.forEach(function(val,index) {id[index] = parseInt(val)});
        ost.saveCurrentCell();
        id[0] += y;
        id[1] += x;
        if(id[0] >= rows || id[0] < 0)
            id[0] = rows-Math.abs(id[0]);
        if(id[1] >= columns || id[1] < 0)
            id[1] = columns-Math.abs(id[1]);
        if (options["headers"][id[1]][2])
        {
            ost.editCell($(options["jid"]+'#cell'+id[0]+'-'+id[1])[0]);
        }
        else
        {
            ost.escapeCurrentCell();
        }
    }

    this.undo = function()
    {
        if(undoStack.length == 0)return;
        let cell = undoStack.pop();
        cell.undo(cell['element']);
        redoStack.push(cell);
    }

    this.redo = function()
    {
        if(redoStack.length == 0)return;
        let cell = redoStack.pop();
        cell.redo(cell['element']);
        undoStack.push(cell);
    }

    this.getData = function()
    {
        let tempData = [];
        $(options["jid"]+'tbody tr').each(function()
        {
            let temp = [];
            for(let col=0;col<$(this).children().length-1;col++)
            {
                temp.push($($(this).children()[col]).text());
            }
            tempData.push(temp);
        });
        return tempData;
    }

    $(options["jid"]).on('click', '.deleteRow', function(event) {
        if (options["deleteRows"]) 
        {
            ost.deleteRow(this);
        }
    })

    $(options["jid"]).on('click', 'td:not(.deleteRow)', function(event) {

        let id = this.id.substring(4).split('-');
        if (options["headers"][id[1]][2]) 
        {
            ost.editCell(this);
        }
    })

    $(options["jid"]).on('blur', '.editCell', function(event) {
        ost.saveCurrentCell();
    })

    $(options["jid"]).on('keydown', '.editCell', function(event) {
        if(event.keyCode == KEYS.ENTER)
        {
            ost.saveCurrentCell();
        }
        else if(event.keyCode == KEYS.ESCAPE)
        {
            ost.escapeCurrentCell();
        }
        else if(event.keyCode == KEYS.TAB && options["tabToMove"])
        {
            event.preventDefault();
            ost.tabCell();
        }
        else if(event.keyCode == KEYS.LEFT && event.ctrlKey && options["arrowsToMove"])
        {
            ost.moveCell(0,-1);
        }
        else if(event.keyCode == KEYS.RIGHT && event.ctrlKey && options["arrowsToMove"])
        {
            ost.moveCell(0,1);
        }
        else if(event.keyCode == KEYS.UP && event.ctrlKey && options["arrowsToMove"])
        {
            ost.moveCell(-1,0);
        }
        else if(event.keyCode == KEYS.DOWN && event.ctrlKey && options["arrowsToMove"])
        {
            ost.moveCell(1,0);
        }
    })

    function validate(element)
    {
        let column = parseInt(element.attr('id').substring(4).split('-')[1]);
        let text = element.text().trim() || '';
        if(options["headers"][column][1] == "")
        {
            element.text(formatDate(text));
        }
       /* if(!validation[column][0](text))
        {
            element.addClass('alert alert-danger invalidCell').attr('title',validation[column][1]());
        }
        else
        {
            element.removeClass('alert alert-danger invalidCell').removeAttr('title');
        }*/
    }
    function formatDate(date)
    {
        try
        {
            date = new Date(date)
            let day = date.getDate();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            if (month < 10) {
                month = "0" + month;
            }
            if (day < 10) {
                day = "0" + day;
            }
            date = month +"/"+day+"/"+year;
            
            return date;
        }
        catch(exception) { console.log(exception)}
    }

    this.validatTable = function()
    {
        $('#clearRatings').show();
        if($('.invalidCell').length == 0)
        {
            $('#invalidWarning').hide('slow');
            $('#submitRatings').show().prop('disabled',false);
        }
        else
        {
            $('#invalidWarning').show('slow');
            $('#submitRatings').show().prop('disabled',true);
        }
    }
}
