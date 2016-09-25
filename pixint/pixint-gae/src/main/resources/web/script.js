var _app_version;

var BASE_URL = '/servlet/';

function clickLink() {
    var $this = $(this);
    var url = $this.attr('href');
    var submitForm = $this.attr('form');
    if (url === '#') {
        back();
    } else if (url[0] == '#') {
        if (!$this.hasClass('same_command')) {
            command.execute({ command: url.substring(1), commandName: $this.html(), submitForm: submitForm });
        } else {
            command.execute({ command: url.substring(1), submitForm: submitForm });
        }
    }
}

function showPanel(panelClass) {
/*
    $('.panel, .' + panelClass + ' h2, .' + panelClass + ' .content').hide().finish();
    setTimeout(function () {
        $('.panel, .' + panelClass + ' h2, .' + panelClass + ' .content').hide().finish();
        $('.' + panelClass + ' h2, .' + panelClass + ' .content').finish().fadeIn(300);
        $('.' + panelClass).finish().fadeIn(100);
    }, 500);
*/
    $('.panel, .' + panelClass + ' h2, .' + panelClass + ' .content').hide();
    setTimeout(function () {
        $('.panel, .' + panelClass + ' h2, .' + panelClass + ' .content').hide();
        $('.' + panelClass + ' h2, .' + panelClass + ' .content').show();
        $('.' + panelClass).show();
    }, 30);
}

var loader = (function () {
    var timer;
    var _element;
    var dots;

    function _start(jqQuery) {
        _element = $(jqQuery);
        dots = '';
        _element.html(dots);
        timer = setInterval(addDot, 200);
    }

    function addDot() {
        dots += '> ';
        _element.html(dots);
    }

    function _stop() {
        clearInterval(timer);
    }

    return {
        start: _start,
        stop: _stop
    };
})();

function render(webComponent) {
    var componentType = webComponent._type;
    var id = webComponent._id;
    var name = webComponent._name;

    var out = '';
    switch (componentType) {
        case 'Div': out += renderDivOrForm('div', webComponent); break;
        case 'Form': out += renderDivOrForm('form', webComponent); break;
        case 'SelectFilter': out += renderSelectFilter(webComponent); break;
        case 'Label': out += '<label class="wc_label">' + webComponent.data + '</label>'; break;
    }
    return out;
}

function renderDivOrForm(elemType, webComponent) {
    var data = webComponent.data;
    var id = webComponent._id;
    id = id ? ' id="' + id + '"' : '';
    var out = '<' + elemType + ' class="wc_' + elemType + '"' + id + '>';
    if (data.length > 0) {
        for (i in data) {
            out += render(data[i]);
        }
    }
    return out + '</' + elemType + '>';
}

function renderSelectFilter(webComponent) {
    var data = webComponent.data;
    var id = webComponent._id;
    id = id ? ' id="' + id + '"' : '';
    var name = webComponent._name;
    name = name ? ' name="' + name + '"' : '';
    var out = '<select class="wc_select"' + id + name + '>';
    var i, subElement;
    for (i in data) {
        subElement = data[i];
        out += '<option value="' + subElement.key + '">' + subElement.value + '</option>';
    }
    out += '</select>';
    return out;
}

function tablefy(body, data, breadcrumb) {
    data = data || {};
    var tableFields = data.bodyTableFields || [];
    if (tableFields && tableFields.length == 1 && tableFields[0] == '') {
        return objectTable(body, data);
    }
    breadcrumb = breadcrumb || '';
    if (typeof body === 'string') {
        return body;
    }
    var key;
    var val;
    var fullKey;
    var out = '<table class="tablefy">\n';
    for (key in body) {
        val = body[key];
        fullKey = breadcrumb + '/' + key;
        if (tableFields.indexOf(fullKey) >= 0) {
            val = objectTable(val, data);
        } else if (typeof val === 'object') {
            val = tablefy(val, data, fullKey);
        }
        out += '<tr><th>' + key + ':<th><td>' + val + '</td></tr>\n';
    }
    out += '</table>\n'
    return out;
}

function objectTable(objectArray, data) {
    var headers = Object.keys(objectArray[0]);
    var html = '<table class="object"><thead><tr>';
    var i, j, row;
    if (data.tableAction) {
        html += '<th></th>';
    }
    for (i in headers) {
        html += '<th>' + headers[i] + '</th>';
    }
    html += '</tr></thead><tbody>';
    for (j in objectArray) {
        row = objectArray[j];
        /*
        console.log(row);
        console.log(data);
        console.log(data.keyColumn);
        console.log(row[data.keyColumn]);
        */
        if (data.tableAction) {
            html += '<tr class="clickable" onclick="command.fromTable(\'' + data.tableAction + '?' + row[data.keyColumn] + '\')"><td>▶</td>';
        } else {
            html += '<tr>';
        }
        for (i in headers) {
            html += '<td>' + row[headers[i]] + '</td>';
        }
        html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
}

var _commandGroups;
function renderMenu(destination, data) {
    var commandGroups = data.commands;
    var i, j, l, commandGroup, command;
    var html = '';
    var description;
    _commandGroups = commandGroups;
    for (i in commandGroups) {
        commandGroup = commandGroups[i];
        description = commandGroup.description;
        if (commandGroup.name) {
            html += '<div class="command_group"><h2>' + commandGroup.name + '</h2>';
        }
        html += '<ul class="content">';
        for (j in commandGroup.commands) {
            command = commandGroup.commands[j];

            html += '<li><a href="#' + command.action
                + (command.submitForm ? '" form="' + command.submitForm : '')
                + '">' + command.name + '</a></li>';
        }
        html += '</ul>';
        if (description.length > 0) {
            html += '<ul class="description">';
            for (l in description) {
                html += '<li>' + description[l] + '</li>';
            }
            html += '</ul>';
        }
        if (commandGroup.name) {
            html += '</div>';
        }
    }
    $(destination).html(html);
    $(destination + ' a').each(function () {
        $(this).click(clickLink);
    });
}

var command = (function () {

    var _command;
    var _commandName;

    function _fromTable(command) {
        window.location.assign('#' + command);
        _execute({ command: command });
    }

    function _execute(args) {
        var command = args.command;
        var commandName = args.commandName;
        var delay = args.delay;
        var changedCommandName = commandName != _commandName;
        var continued = delay || false;
        if (commandName != null) {
            _commandName = commandName;
        }
        var formData = null;
        if (args.submitForm) {
            formData = $('#' + args.submitForm).serialize();
        }
//        console.log(args.submitForm);
//        console.log(formData);
        if (!continued) {
            showPanel('initialize');
            loader.start('.dots');
            $('.command_name').html(_commandName);
            $('.same_command').attr('href', '#' + command);
        } else {
            if (changedCommandName) {
                $('.command_name').html(_commandName);
                $('.panel h2').hide().finish().delay(30).fadeIn(500);
            }
        }
        commandName = _commandName;
        if (!continued) {
            $.post(BASE_URL + command, formData, postCallback).fail(postError);
        } else {
            setTimeout(function () {
                $.post(BASE_URL + command, formData, postCallback).fail(postError);
            }, delay);
        }
        _command = command;
        return false;
    }

    function postError() {
        showPanel('finished_command');
        loader.stop();
        $('#command_answer').html("Could not complete request. Is the server up?").addClass('error');
    }

    function postCallback(data) {
        var status = data.status;
        var body = data.body;
//        console.log(_command);
//        console.log(data.followup);
//        console.log(data.commands);
//        console.log('');
        var followup = data.followup;
        if (followup) {
            command.execute({ command: followup.action, commandName: followup.name, delay: 1500 });
            return;
        }
        switch (status) {
            case 'INVALID_REQUEST':
                loader.stop();
                showPanel('finished_command');
                $('#command_answer').html("Could not complete request. Invalid command!").addClass('error');
                break;
            case 'INITIALIZED':
                _app_version = body;
                $('body > h1').html($('body > h1').html() + ' ' + _app_version);
                loader.stop();
                // console.log(data);
                renderMenu('.index ', data);
                showPanel('index');
                break;
            case 'SUCCESS':
                loader.stop();
                if (data.commands.length > 0) {
                    renderMenu('.finished_command .commands', data);
                }
                showPanel('finished_command');
                switch (_command) {
                    case 'job/last_run':
                        if (body === '') {
                            body = 'No job has run on ScrapingHub.';
                        } else {
                            body = 'Last job ran [' + body + '] minutes ago.';
                        }
                        break;
                    default:
                        body = tablefy(body, data);
                }
                break;
            case 'FILTER':
                loader.stop();
                if (data.commands.length > 0) {
                    renderMenu('.finished_command .commands', data);
                }
                showPanel('finished_command');
                // console.log(data);
                body = render(body, data);
                break;
            case 'EXCEPTION':
                loader.stop();
                showPanel('finished_command');
                body = '<p class="error">Server error.</p>' + tablefy(body);
        }
        $('#command_answer').html(body).removeClass('error');
    }

    return {
        execute: _execute,
        fromTable: _fromTable
    }
})();


function back() {
    showPanel('index');
}

$(function () {
    $('a').each(function () {
        $(this).click(clickLink);
    });
    $('.panel').hide();
    $('body').removeClass('loading');
    command.execute({ command: 'init', commandName: 'Starting application' });
});
